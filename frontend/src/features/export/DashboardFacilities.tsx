import { FormEvent, MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import { parseFacilityCode, suggestFacilityCode } from "@shared/domain/facilityCode.js";
import { formatCountryLabel } from "@shared/domain/isoCountries.js";
import * as facilitiesApi from "../../api/facilities";
import { FacilityCodeFields } from "../../components/FacilityCodeFields";
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
import { exportFilteredFacilitiesCsv } from "./tradeMastersFilteredExport";

const EMPTY_FORM = {
  code: "",
  name: "",
  country: "",
  functionCode: "WHS",
  line1: "",
  city: "",
  postalCode: "",
};

function facilityFunctionLabel(code: string, t: (key: string) => string) {
  const parsed = parseFacilityCode(code);
  if (!parsed) return "—";
  const key = `facilities.fieldFunction.${parsed.functionCode}`;
  const label = t(key);
  return label !== key ? label : parsed.functionCode;
}

export function DashboardFacilities() {
  const { t, locale } = useAppTranslation();
  const { showToast } = useAppToast();
  const { user } = useAuth();
  const isClientPortal = !!user?.isClientPortal;

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [codeTouched, setCodeTouched] = useState(false);

  useEffect(() => {
    if (!showModal || codeTouched) return;
    const suggested = suggestFacilityCode({
      country: form.country,
      name: form.name,
      city: form.city,
      functionCode: form.functionCode,
    });
    if (suggested) {
      setForm((f) => (f.code === suggested ? f : { ...f, code: suggested }));
    }
  }, [showModal, codeTouched, form.country, form.name, form.city, form.functionCode, form.code]);

  const fetchItems = useCallback(() => facilitiesApi.fetchFacilities(), []);

  const filterColumns = useMemo<ColumnFilterDef<facilitiesApi.Facility>[]>(
    () => [
      buildTextFilterColumn(
        "name",
        t("facilities.thName"),
        (row) => row.name,
        (row) => [row.name]
      ),
      buildTextFilterColumn(
        "code",
        t("facilities.thCode"),
        (row) => row.code,
        (row) => [row.code]
      ),
      buildDiscreteFilterColumn("country", t("facilities.thCountry"), (row) =>
        row.country ? formatCountryLabel(row.country, locale) : "—"
      ),
      buildDiscreteFilterColumn("function", t("facilities.thFunction"), (row) =>
        facilityFunctionLabel(row.code, t)
      ),
      buildTextFilterColumn(
        "city",
        t("partyProfile.city"),
        (row) => row.city,
        (row) => [row.city]
      ),
      buildTextFilterColumn(
        "line1",
        t("facilities.fieldAddress"),
        (row) => row.line1,
        (row) => [row.line1]
      ),
    ],
    [locale, t]
  );

  const list = useModuleListPage(fetchItems, "facilities.loadFailed", filterColumns);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setActionError("");
    try {
      await facilitiesApi.createFacility({
        code: form.code,
        name: form.name,
        country: form.country,
        line1: form.line1,
        line2: "",
        city: form.city,
        postalCode: form.postalCode,
        locationCode: "",
        notes: "",
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
      setCodeTouched(false);
      await list.load();
    } catch (err) {
      setActionError(messageFromApiErrorOrKey(err, t, "facilities.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: facilitiesApi.Facility, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    const label = `${row.name} (${row.code})`;
    if (!window.confirm(t("facilities.deleteConfirm", { name: label }))) return;
    setDeletingId(row.id);
    setActionError("");
    try {
      await facilitiesApi.removeFacility(row.id);
      await list.load();
    } catch (err) {
      setActionError(messageFromApiErrorOrKey(err, t, "facilities.deleteFailed"));
    } finally {
      setDeletingId(null);
    }
  }

  const listActions = (
    <>
      <button
        type="button"
        className="btn btn--secondary btn--sm"
        disabled={list.loading}
        onClick={() => {
          if (list.filteredItems.length === 0) {
            showToast({ message: t("tradeMastersImport.exportEmpty"), variant: "info" });
            return;
          }
          exportFilteredFacilitiesCsv(list.filteredItems);
          showToast({
            message: t("tradeMastersImport.exportDone", { count: list.filteredItems.length }),
            variant: "success",
          });
        }}
      >
        {t("tradeMastersImport.exportCsv")}
      </button>
      <button type="button" className="btn btn--secondary btn--sm" onClick={() => setImportOpen(true)}>
        {t("tradeMastersImport.importExcel")}
      </button>
      <button type="button" className="btn btn--primary btn--sm" onClick={() => setShowModal(true)}>
        {t("facilities.addFacility")}
      </button>
    </>
  );

  return (
    <section className="panel panel--trade-setup">
      {(actionError || list.error) && (
        <p className="panel__error" role="alert">
          {actionError || list.error}
        </p>
      )}

      <div className="trade-setup-card trade-setup-card--directory">
        {list.loading ? <p className="panel__muted">{t("facilities.loading")}</p> : null}

        {!list.loading && list.showEmptyDataset ? (
          <div className="trade-setup-empty">
            <p className="trade-setup-empty__title">{t("facilities.emptyTitle")}</p>
            <div className="trade-setup-empty__actions">
              <button type="button" className="btn btn--primary" onClick={() => setShowModal(true)}>
                {t("facilities.addFacility")}
              </button>
            </div>
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
                filteredCount={list.filteredItems.length}
                totalCount={list.items.length}
                globalSearch={list.globalSearch}
                onGlobalSearchChange={list.setGlobalSearch}
                searchPlaceholder={t("facilities.globalSearchPlaceholder")}
                activeFilterChips={list.activeFilterChips}
                onClearColumnFilter={list.clearColumnFilterById}
                trailingActions={listActions}
              />
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
              filteredCount={list.filteredItems.length}
              totalCount={list.items.length}
            />
            <div className="dash-table-wrap dash-table-wrap--flush">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>{t("facilities.thName")}</th>
                    <th>{t("facilities.thCode")}</th>
                    <th>{t("facilities.thCountry")}</th>
                    <th>{t("facilities.thFunction")}</th>
                  </tr>
                </thead>
                <tbody>
                  {list.filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="dash-table__empty">
                        {t("moduleList.noResults")}
                      </td>
                    </tr>
                  ) : (
                    list.filteredItems.map((row) => {
                      const isCatalogPort = row.catalogSource === "unloc";
                      return (
                        <tr
                          key={row.id}
                          className={`trade-setup-directory-row${isCatalogPort ? " trade-setup-directory-row--static" : ""}`}
                        >
                          <td className="trade-setup-directory-row__name">
                            <div className="trade-setup-directory-row__name-inner">
                              <span className="trade-setup-directory-row__name-label">{row.name}</span>
                              {!isCatalogPort ? (
                                <button
                                  type="button"
                                  className="btn btn--ghost btn--sm btn--danger trade-setup-directory-row__inline-action"
                                  disabled={deletingId === row.id}
                                  onClick={(event) => void handleDelete(row, event)}
                                >
                                  {t("partyProfile.remove")}
                                </button>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            <code className="trade-setup-alias-code">{row.code}</code>
                          </td>
                          <td>
                            {row.country ? (
                              <span className="trade-setup-country-tag">
                                {formatCountryLabel(row.country, locale)}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>{facilityFunctionLabel(row.code, t)}</td>
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
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setForm(EMPTY_FORM);
          setCodeTouched(false);
        }}
        title={t("facilities.addFacility")}
        closeLabel={t("partyProfile.cancel")}
        className="app-modal--wide"
      >
        <form className="entity-form" onSubmit={handleCreate}>
          <section className="party-profile__form-section">
            <h3 className="party-profile__form-section-title">{t("facilities.sectionIdentity")}</h3>
            <div className="party-profile__form-grid">
              <FacilityCodeFields
                idPrefix="facility"
                value={form}
                onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
                onCodeTouched={() => setCodeTouched(true)}
                onSuggestReset={() => setCodeTouched(false)}
              />
            </div>
          </section>

          <section className="party-profile__form-section">
            <h3 className="party-profile__form-section-title">{t("facilities.sectionLocation")}</h3>
            <div className="party-profile__form-grid">
              <div className="field field--span-12">
                <label className="field__label" htmlFor="facility-line1">
                  {t("facilities.fieldAddress")}
                </label>
                <input
                  id="facility-line1"
                  className="field__input"
                  value={form.line1}
                  onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
                  placeholder={t("facilities.fieldAddressPlaceholder")}
                />
              </div>
              <div className="field field--span-6">
                <label className="field__label" htmlFor="facility-city">
                  {t("partyProfile.city")}
                </label>
                <input
                  id="facility-city"
                  className="field__input"
                  value={form.city}
                  onChange={(e) => {
                    setCodeTouched(false);
                    setForm((f) => ({ ...f, city: e.target.value }));
                  }}
                />
              </div>
              <div className="field field--span-6">
                <label className="field__label" htmlFor="facility-postal">
                  {t("partyProfile.postalCode")}
                </label>
                <input
                  id="facility-postal"
                  className="field__input"
                  value={form.postalCode}
                  onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                />
              </div>
            </div>
          </section>

          <div className="party-profile__form-actions">
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? t("partyProfile.saving") : t("facilities.saveFacility")}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={saving}
              onClick={() => setShowModal(false)}
            >
              {t("partyProfile.cancel")}
            </button>
          </div>
        </form>
      </Modal>

      <TradeMastersImportModal
        open={importOpen}
        kind="facilities"
        onClose={() => setImportOpen(false)}
        onImportSuccess={() => void list.load()}
      />
    </section>
  );
}
