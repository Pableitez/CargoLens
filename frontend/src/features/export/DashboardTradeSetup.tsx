import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { suggestBeCode } from "@shared/domain/beCode.js";
import { formatCountryLabel } from "@shared/domain/isoCountries.js";
import { normalizePartyVat } from "@shared/domain/partyVat.js";
import { PartyBeCodeFields } from "../../components/PartyBeCodeFields";
import * as partiesApi from "../../api/parties";
import { Modal } from "../../components/Modal.jsx";
import { ModuleFilterSidebar } from "../../components/ModuleFilterSidebar";
import { ModuleListToolbar } from "../../components/ModuleListToolbar";
import { useAuth } from "../../contexts/AuthContext";
import { useAppToast } from "../../hooks/useAppToast";
import { useModuleListPage } from "../../hooks/useModuleListPage";
import { messageFromApiErrorOrKey } from "../../i18n/apiMessage.js";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { buildDiscreteFilterColumn, buildTextFilterColumn } from "../../utils/moduleFilterColumns";
import type { ColumnFilterDef } from "../../utils/facetFilters";
import { TradeMastersImportModal } from "./TradeMastersImportModal";
import { exportFilteredPartiesCsv } from "./tradeMastersFilteredExport";
import { partyProfilePath } from "./tradeSetupPaths";

type PartyFilter = "all" | "contractual" | "operational";

const EMPTY_PARTY_FORM = {
  code: "",
  legalName: "",
  country: "",
  city: "",
  addressLine1: "",
  postalCode: "",
  vat: "",
  notes: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  contactJobTitle: "",
  functionCode: "HQ",
};

function isContractualParty(p: partiesApi.Party) {
  return (p.accountTier ?? "operational") === "contractual";
}

export function DashboardTradeSetup() {
  const { t, locale } = useAppTranslation();
  const { showToast } = useAppToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isClientPortal = !!user?.isClientPortal;
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<PartyFilter>(() => {
    const raw = searchParams.get("filter");
    return raw === "contractual" || raw === "operational" ? raw : "all";
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [partyForm, setPartyForm] = useState(EMPTY_PARTY_FORM);
  const [partyCodeTouched, setPartyCodeTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const fetchItems = useCallback(() => partiesApi.fetchParties(), []);

  const filterColumns = useMemo<ColumnFilterDef<partiesApi.Party>[]>(() => {
    const cols: ColumnFilterDef<partiesApi.Party>[] = [
      buildTextFilterColumn(
        "legalName",
        t("partyField.party"),
        (row) => row.legalName,
        (row) => [row.legalName]
      ),
      buildTextFilterColumn(
        "code",
        t("partyField.beCode"),
        (row) => row.code,
        (row) => [row.code]
      ),
      buildTextFilterColumn(
        "vat",
        t("parties.thVat"),
        (row) => row.vat,
        (row) => [row.vat]
      ),
      buildDiscreteFilterColumn("country", t("tradeSetup.partyCountry"), (row) =>
        row.country ? formatCountryLabel(row.country, locale) : "—"
      ),
      buildTextFilterColumn(
        "city",
        t("partyProfile.city"),
        (row) => row.city,
        (row) => [row.city]
      ),
      buildTextFilterColumn(
        "address",
        t("partyProfile.address"),
        (row) => row.address,
        (row) => [row.address]
      ),
    ];
    if (!isClientPortal) {
      cols.splice(
        2,
        0,
        buildDiscreteFilterColumn("accountType", t("tradeSetup.accountType"), (row) =>
          isContractualParty(row)
            ? t("tradeSetup.accountTypeContractual")
            : t("tradeSetup.accountTypeOperational")
        )
      );
    }
    return cols;
  }, [isClientPortal, locale, t]);

  const list = useModuleListPage(fetchItems, "tradeSetup.loadFailed", filterColumns);

  useEffect(() => {
    const add = searchParams.get("add");
    if ((add === "party" || add === "contractual") && !isClientPortal) {
      setShowAddModal(true);
      const next = new URLSearchParams(searchParams);
      next.delete("add");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, isClientPortal]);

  const tabFilteredParties = useMemo(() => {
    if (filter === "contractual") return list.filteredItems.filter(isContractualParty);
    if (filter === "operational") return list.filteredItems.filter((p) => !isContractualParty(p));
    return list.filteredItems;
  }, [list.filteredItems, filter]);

  function setPartyFilter(next: PartyFilter) {
    setFilter(next);
    const params = new URLSearchParams(searchParams);
    if (next === "all") params.delete("filter");
    else params.set("filter", next);
    setSearchParams(params, { replace: true });
  }

  function openAddModal() {
    setShowAddModal(true);
  }

  function closeAddModal() {
    setShowAddModal(false);
    setPartyForm(EMPTY_PARTY_FORM);
    setPartyCodeTouched(false);
  }

  useEffect(() => {
    if (!showAddModal || partyCodeTouched) return;
    const suggested = suggestBeCode({
      country: partyForm.country,
      legalName: partyForm.legalName,
      functionCode: partyForm.functionCode,
    });
    if (suggested) {
      setPartyForm((f) => (f.code === suggested ? f : { ...f, code: suggested }));
    }
  }, [
    showAddModal,
    partyCodeTouched,
    partyForm.country,
    partyForm.legalName,
    partyForm.functionCode,
    partyForm.code,
  ]);

  function accountSummaryLabel(p: partiesApi.Party) {
    if (!isContractualParty(p)) return t("tradeSetup.accountSummaryOperational");
    if ((p.contractualTier ?? "primary") === "subsidiary") {
      return t("tradeSetup.accountSummaryContractualSub");
    }
    return t("tradeSetup.accountSummaryContractualPrimary");
  }

  function accountBadgeClass(p: partiesApi.Party) {
    if (!isContractualParty(p)) return "trade-setup-badge trade-setup-badge--operational";
    if ((p.contractualTier ?? "primary") === "subsidiary") {
      return "trade-setup-badge trade-setup-badge--subsidiary";
    }
    return "trade-setup-badge trade-setup-badge--contractual";
  }

  async function handleCreateParty(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const addressLine1 = partyForm.addressLine1.trim();
    const payload: partiesApi.PartyCreate = {
      code: partyForm.code,
      legalName: partyForm.legalName,
      country: partyForm.country,
      city: partyForm.city,
      address: addressLine1,
      vat: partyForm.vat,
      notes: partyForm.notes,
    };

    if (addressLine1) {
      payload.addressBook = [
        {
          label: "registered",
          line1: addressLine1,
          line2: "",
          city: partyForm.city,
          country: partyForm.country,
          postalCode: partyForm.postalCode,
          isPrimary: true,
        },
      ];
    }

    if (partyForm.contactName.trim()) {
      payload.contacts = [
        {
          name: partyForm.contactName.trim(),
          email: partyForm.contactEmail,
          phone: partyForm.contactPhone,
          jobTitle: partyForm.contactJobTitle,
          isPrimary: true,
        },
      ];
    }

    try {
      const created = await partiesApi.createParty(payload);
      closeAddModal();
      await list.load();
      navigate(partyProfilePath(isClientPortal, created.id));
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "tradeSetup.partySaveFailed"));
    } finally {
      setSaving(false);
    }
  }

  const filterCounts = useMemo(
    () => ({
      all: list.items.length,
      contractual: list.items.filter(isContractualParty).length,
      operational: list.items.filter((p) => !isContractualParty(p)).length,
    }),
    [list.items]
  );

  const accountTypeTabs = !isClientPortal ? (
    <div
      className="trade-setup-tabs trade-setup-tabs--inline"
      role="tablist"
      aria-label={t("tradeSetup.filterAria")}
    >
      {(["all", "contractual", "operational"] as const).map((key) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={filter === key}
          className={`trade-setup-tabs__btn${filter === key ? " trade-setup-tabs__btn--active" : ""}`}
          onClick={() => setPartyFilter(key)}
        >
          {t(`tradeSetup.filter${key.charAt(0).toUpperCase()}${key.slice(1)}`)}
          <span className="trade-setup-tabs__count">{filterCounts[key]}</span>
        </button>
      ))}
    </div>
  ) : null;

  return (
    <section className="panel panel--trade-setup">
      {(error || list.error) && !showAddModal ? (
        <p className="panel__error" role="alert">
          {error || list.error}
        </p>
      ) : null}

      <div className="trade-setup-card trade-setup-card--directory">
        {list.loading ? <p className="panel__muted">{t("tradeSetup.loading")}</p> : null}

        {!list.loading && list.showEmptyDataset ? (
          <div className="trade-setup-empty">
            <p className="trade-setup-empty__title">{t("tradeSetup.noPartiesTitle")}</p>
            {!isClientPortal ? (
              <div className="trade-setup-empty__actions">
                <button type="button" className="btn btn--primary" onClick={() => openAddModal()}>
                  {t("tradeSetup.addParty")}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {!list.loading && list.hasItems ? (
          <>
            <div className="trade-setup-list-bar">
              <ModuleListToolbar
                onOpenFilters={list.openSidebar}
                sidebarOpen={list.sidebarOpen}
                activeFilterCount={list.activeFilterCount}
                onClearFilters={list.clearFilters}
                filteredCount={tabFilteredParties.length}
                totalCount={list.items.length}
                globalSearch={list.globalSearch}
                onGlobalSearchChange={list.setGlobalSearch}
                searchPlaceholder={t("parties.globalSearchPlaceholder")}
                activeFilterChips={list.activeFilterChips}
                onClearColumnFilter={list.clearColumnFilterById}
                trailingActions={
                  <>
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      disabled={list.loading}
                      onClick={() => {
                        if (tabFilteredParties.length === 0) {
                          showToast({ message: t("tradeMastersImport.exportEmpty"), variant: "info" });
                          return;
                        }
                        exportFilteredPartiesCsv(tabFilteredParties);
                        showToast({
                          message: t("tradeMastersImport.exportDone", {
                            count: tabFilteredParties.length,
                          }),
                          variant: "success",
                        });
                      }}
                    >
                      {t("tradeMastersImport.exportCsv")}
                    </button>
                    {!isClientPortal ? (
                      <>
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
                          onClick={() => setImportOpen(true)}
                        >
                          {t("tradeMastersImport.importExcel")}
                        </button>
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => openAddModal()}
                        >
                          {t("tradeSetup.addParty")}
                        </button>
                      </>
                    ) : null}
                  </>
                }
              >
                {accountTypeTabs}
              </ModuleListToolbar>
            </div>
            <ModuleFilterSidebar
              open={list.sidebarOpen}
              onClose={list.closeSidebar}
              columns={filterColumns}
              facets={list.facets}
              filters={list.filters}
              isColumnActive={list.isColumnActive}
              onSearchQueryChange={list.setSearchQuery}
              onAddOption={list.addOption}
              onToggleOption={list.toggleOption}
              onRemoveOption={list.removeOption}
              onClearOptionSelection={list.clearOptionSelection}
              onClearAll={list.clearFilters}
              filteredCount={tabFilteredParties.length}
              totalCount={list.items.length}
            />
            <div className="dash-table-wrap dash-table-wrap--flush">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>{t("partyField.party")}</th>
                    <th>{t("partyField.beCode")}</th>
                    {!isClientPortal ? <th>{t("tradeSetup.accountType")}</th> : null}
                    <th>{t("parties.thVat")}</th>
                    <th>{t("tradeSetup.partyCountry")}</th>
                  </tr>
                </thead>
                <tbody>
                  {tabFilteredParties.length === 0 ? (
                    <tr>
                      <td colSpan={isClientPortal ? 4 : 5} className="dash-table__empty">
                        {t("moduleList.noResults")}
                      </td>
                    </tr>
                  ) : (
                    tabFilteredParties.map((p) => {
                      const profilePath = partyProfilePath(isClientPortal, p.id);
                      return (
                        <tr
                          key={p.id}
                          className="trade-setup-directory-row"
                          tabIndex={0}
                          role="link"
                          onClick={() => navigate(profilePath)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              navigate(profilePath);
                            }
                          }}
                        >
                          <td className="trade-setup-directory-row__name">{p.legalName}</td>
                          <td>
                            <code className="trade-setup-alias-code">{p.code}</code>
                          </td>
                          {!isClientPortal ? (
                            <td>
                              <span className={accountBadgeClass(p)}>{accountSummaryLabel(p)}</span>
                            </td>
                          ) : null}
                          <td>{p.vat || "—"}</td>
                          <td>
                            {p.country ? (
                              <span className="trade-setup-country-tag">
                                {formatCountryLabel(p.country, locale)}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>

      <Modal
        open={showAddModal}
        onClose={closeAddModal}
        title={t("tradeSetup.addPartyModalTitle")}
        closeLabel={t("partyProfile.cancel")}
        className="app-modal--wide"
      >
        <form className="party-profile__edit-form" onSubmit={handleCreateParty}>
          {error ? (
            <p className="panel__error" role="alert">
              {error}
            </p>
          ) : null}

          <p className="party-profile__inline-note party-profile__inline-note--form">
            {t("tradeSetup.createAccountTypeHint")}
          </p>

          <div className="party-profile__form-section">
            <h3 className="party-profile__form-section-title">{t("partyProfile.sectionIdentity")}</h3>
            <div className="party-profile__form-grid">
              <PartyBeCodeFields
                idPrefix="new-party"
                value={partyForm}
                onChange={(patch) => setPartyForm((f) => ({ ...f, ...patch }))}
                onCodeTouched={() => setPartyCodeTouched(true)}
                onSuggestReset={() => setPartyCodeTouched(false)}
              />
              <div className="field field--span-4">
                <label className="field__label" htmlFor="new-party-vat">
                  {t("parties.fieldVat")}
                </label>
                <input
                  id="new-party-vat"
                  className="field__input"
                  value={partyForm.vat}
                  required
                  autoComplete="off"
                  placeholder={t("parties.fieldVatPlaceholder")}
                  onChange={(e) => setPartyForm((f) => ({ ...f, vat: e.target.value }))}
                  onBlur={(e) => setPartyForm((f) => ({ ...f, vat: normalizePartyVat(e.target.value) }))}
                />
              </div>
              <div className="field field--span-4">
                <label className="field__label" htmlFor="new-party-city">
                  {t("partyProfile.city")}
                </label>
                <input
                  id="new-party-city"
                  className="field__input"
                  value={partyForm.city}
                  onChange={(e) => setPartyForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="field field--span-4">
                <label className="field__label" htmlFor="new-party-postal">
                  {t("partyProfile.postalCode")}
                </label>
                <input
                  id="new-party-postal"
                  className="field__input"
                  value={partyForm.postalCode}
                  onChange={(e) => setPartyForm((f) => ({ ...f, postalCode: e.target.value }))}
                />
              </div>
              <div className="field field--span-12">
                <label className="field__label" htmlFor="new-party-address">
                  {t("partyProfile.registeredOffice")}
                </label>
                <input
                  id="new-party-address"
                  className="field__input"
                  value={partyForm.addressLine1}
                  onChange={(e) => setPartyForm((f) => ({ ...f, addressLine1: e.target.value }))}
                />
              </div>
              <div className="field field--span-12">
                <label className="field__label" htmlFor="new-party-notes">
                  {t("partyProfile.notes")}
                </label>
                <textarea
                  id="new-party-notes"
                  className="field__input field__textarea"
                  rows={2}
                  value={partyForm.notes}
                  onChange={(e) => setPartyForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="party-profile__form-section">
            <h3 className="party-profile__form-section-title">{t("partyProfile.sectionContacts")}</h3>
            <div className="party-profile__form-grid">
              <div className="field field--span-6">
                <label className="field__label" htmlFor="new-party-contact-name">
                  {t("partyProfile.contactName")}
                </label>
                <input
                  id="new-party-contact-name"
                  className="field__input"
                  value={partyForm.contactName}
                  onChange={(e) => setPartyForm((f) => ({ ...f, contactName: e.target.value }))}
                />
              </div>
              <div className="field field--span-6">
                <label className="field__label" htmlFor="new-party-contact-title">
                  {t("partyProfile.jobTitle")}
                </label>
                <input
                  id="new-party-contact-title"
                  className="field__input"
                  value={partyForm.contactJobTitle}
                  onChange={(e) => setPartyForm((f) => ({ ...f, contactJobTitle: e.target.value }))}
                />
              </div>
              <div className="field field--span-6">
                <label className="field__label" htmlFor="new-party-contact-email">
                  {t("partyProfile.email")}
                </label>
                <input
                  id="new-party-contact-email"
                  className="field__input"
                  type="email"
                  value={partyForm.contactEmail}
                  onChange={(e) => setPartyForm((f) => ({ ...f, contactEmail: e.target.value }))}
                />
              </div>
              <div className="field field--span-6">
                <label className="field__label" htmlFor="new-party-contact-phone">
                  {t("partyProfile.phone")}
                </label>
                <input
                  id="new-party-contact-phone"
                  className="field__input"
                  value={partyForm.contactPhone}
                  onChange={(e) => setPartyForm((f) => ({ ...f, contactPhone: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="party-profile__form-actions">
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? t("partyProfile.saving") : t("tradeSetup.addParty")}
            </button>
            <button type="button" className="btn btn--ghost" disabled={saving} onClick={closeAddModal}>
              {t("partyProfile.cancel")}
            </button>
          </div>
        </form>
      </Modal>

      <TradeMastersImportModal
        open={importOpen}
        kind="parties"
        onClose={() => setImportOpen(false)}
        onImportSuccess={() => void list.load()}
      />
    </section>
  );
}
