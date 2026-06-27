import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as tradeRelationshipsApi from "../../api/tradeRelationships";
import { ModuleFilterSidebar } from "../../components/ModuleFilterSidebar";
import { ModuleListToolbar } from "../../components/ModuleListToolbar";
import { useAuth } from "../../contexts/AuthContext";
import { messageFromApiErrorOrKey } from "../../i18n/apiMessage.js";
import { useModuleListPage } from "../../hooks/useModuleListPage";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { buildDiscreteFilterColumn, buildTextFilterColumn } from "../../utils/moduleFilterColumns";
import type { ColumnFilterDef } from "../../utils/facetFilters";
import { RelationshipFormModal } from "./RelationshipFormModal";
import { relationshipLabel, roleLabel } from "./partyProfile/utils";
import { removeFacilityRelationshipRow, removePartyRelationshipRow } from "./relationshipMutations";
import { partyProfilePath } from "./tradeSetupPaths";

type Tab = "party" | "facility";

function roleCell(value: string, t: (key: string) => string) {
  if (!value) return "—";
  return relationshipLabel(value, t) || roleLabel(value, t) || value;
}

export function DashboardRelationships() {
  const { t } = useAppTranslation();
  const { user } = useAuth();
  const isClientPortal = !!user?.isClientPortal;
  const [tab, setTab] = useState<Tab>("party");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingPartyRow, setEditingPartyRow] = useState<tradeRelationshipsApi.PartyRelationshipRow | null>(
    null
  );
  const [editingFacilityRow, setEditingFacilityRow] =
    useState<tradeRelationshipsApi.FacilityRelationshipRow | null>(null);
  const [actionError, setActionError] = useState("");
  const [removingId, setRemovingId] = useState("");

  const fetchPartyItems = useCallback(async () => {
    const rows = await tradeRelationshipsApi.fetchPartyRelationships();
    return rows.filter((row) => row.kind === "related");
  }, []);
  const fetchFacilityItems = useCallback(() => tradeRelationshipsApi.fetchFacilityRelationships(), []);

  const partyFilterColumns = useMemo<ColumnFilterDef<tradeRelationshipsApi.PartyRelationshipRow>[]>(
    () => [
      buildTextFilterColumn(
        "primaryParty",
        t("relationships.primaryParty"),
        (row) => row.fromPartyName,
        (row) => [row.fromPartyName, row.fromPartyCode]
      ),
      buildDiscreteFilterColumn("primaryRole", t("relationships.primaryRole"), (row) =>
        roleCell(row.primaryRole, t)
      ),
      buildTextFilterColumn(
        "subsidiaryParty",
        t("relationships.subsidiaryParty"),
        (row) => row.toPartyName,
        (row) => [row.toPartyName, row.toPartyCode]
      ),
      buildDiscreteFilterColumn("subsidiaryRole", t("relationships.subsidiaryRole"), (row) =>
        roleCell(row.relationshipType, t)
      ),
      buildTextFilterColumn(
        "clientAlias",
        t("partyRelationships.thAlias"),
        (row) => row.clientAlias,
        (row) => [row.clientAlias]
      ),
    ],
    [t]
  );

  const facilityFilterColumns = useMemo<ColumnFilterDef<tradeRelationshipsApi.FacilityRelationshipRow>[]>(
    () => [
      buildTextFilterColumn(
        "primaryParty",
        t("relationships.primaryParty"),
        (row) => row.partyName,
        (row) => [row.partyName, row.partyCode]
      ),
      buildDiscreteFilterColumn("primaryRole", t("relationships.primaryRole"), (row) =>
        roleCell(row.primaryRole, t)
      ),
      buildTextFilterColumn(
        "facility",
        t("facilityRelationships.thFacility"),
        (row) => row.facilityName,
        (row) => [row.facilityName, row.facilityCode]
      ),
      buildTextFilterColumn(
        "clientAlias",
        t("partyRelationships.thAlias"),
        (row) => row.notes,
        (row) => [row.notes]
      ),
    ],
    [t]
  );

  const partyList = useModuleListPage(fetchPartyItems, "relationships.partyLoadFailed", partyFilterColumns);
  const facilityList = useModuleListPage(
    fetchFacilityItems,
    "relationships.facilityLoadFailed",
    facilityFilterColumns
  );

  const activeList = tab === "party" ? partyList : facilityList;

  function openAddModal() {
    setModalMode("add");
    setEditingPartyRow(null);
    setEditingFacilityRow(null);
    setModalOpen(true);
  }

  function openEditPartyRow(row: tradeRelationshipsApi.PartyRelationshipRow) {
    setModalMode("edit");
    setEditingPartyRow(row);
    setEditingFacilityRow(null);
    setModalOpen(true);
  }

  function openEditFacilityRow(row: tradeRelationshipsApi.FacilityRelationshipRow) {
    setModalMode("edit");
    setEditingFacilityRow(row);
    setEditingPartyRow(null);
    setModalOpen(true);
  }

  async function handleRemoveParty(row: tradeRelationshipsApi.PartyRelationshipRow) {
    const target = `${row.fromPartyName} → ${row.toPartyName}`;
    if (!window.confirm(t("relationships.confirmRemove", { name: target }))) return;
    setRemovingId(row.id);
    setActionError("");
    try {
      await removePartyRelationshipRow(row);
      await partyList.load();
    } catch (err) {
      setActionError(messageFromApiErrorOrKey(err, t, "relationships.removeFailed"));
    } finally {
      setRemovingId("");
    }
  }

  async function handleRemoveFacility(row: tradeRelationshipsApi.FacilityRelationshipRow) {
    const target = `${row.partyName} → ${row.facilityName}`;
    if (!window.confirm(t("relationships.confirmRemove", { name: target }))) return;
    setRemovingId(row.id);
    setActionError("");
    try {
      await removeFacilityRelationshipRow(row);
      await facilityList.load();
    } catch (err) {
      setActionError(messageFromApiErrorOrKey(err, t, "relationships.removeFailed"));
    } finally {
      setRemovingId("");
    }
  }

  async function handleSaved() {
    setActionError("");
    if (tab === "party") {
      await partyList.load();
    } else {
      await facilityList.load();
    }
  }

  const tabCounts = {
    party: partyList.items.length,
    facility: facilityList.items.length,
  };

  return (
    <section className="panel panel--trade-setup">
      {(actionError || activeList.error) && !modalOpen ? (
        <p className="panel__error" role="alert">
          {actionError || activeList.error}
        </p>
      ) : null}

      <div className="trade-setup-card trade-setup-card--directory">
        <div className="trade-setup-card__intro">
          <h2 className="trade-setup-card__title">{t("relationships.title")}</h2>
        </div>

        <div
          className="trade-setup-tabs trade-setup-tabs--inline"
          role="tablist"
          aria-label={t("relationships.tabAria")}
        >
          {(["party", "facility"] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={`trade-setup-tabs__btn${tab === key ? " trade-setup-tabs__btn--active" : ""}`}
              onClick={() => setTab(key)}
            >
              {t(`relationships.tab.${key}`)}
              <span className="trade-setup-tabs__count">{tabCounts[key]}</span>
            </button>
          ))}
        </div>

        {activeList.loading ? <p className="panel__muted">{t("relationships.loading")}</p> : null}

        {!activeList.loading && activeList.hasItems ? (
          <>
            <div className="trade-setup-list-bar">
              <ModuleListToolbar
                onOpenFilters={activeList.openSidebar}
                sidebarOpen={activeList.sidebarOpen}
                activeFilterCount={activeList.activeFilterCount}
                onClearFilters={activeList.clearFilters}
                filteredCount={activeList.filteredItems.length}
                totalCount={activeList.items.length}
                globalSearch={activeList.globalSearch}
                onGlobalSearchChange={activeList.setGlobalSearch}
                searchPlaceholder={
                  tab === "party"
                    ? t("relationships.searchPartyPlaceholder")
                    : t("relationships.searchFacilityPlaceholder")
                }
                activeFilterChips={activeList.activeFilterChips}
                onClearColumnFilter={activeList.clearColumnFilterById}
                trailingActions={
                  <button type="button" className="btn btn--primary btn--sm" onClick={openAddModal}>
                    {t("relationships.addButton")}
                  </button>
                }
              />
            </div>
            {tab === "party" ? (
              <ModuleFilterSidebar<tradeRelationshipsApi.PartyRelationshipRow>
                open={partyList.sidebarOpen}
                onClose={partyList.closeSidebar}
                columns={partyList.filterColumns}
                facets={partyList.facets}
                filters={partyList.filters}
                isColumnActive={partyList.isColumnActive}
                onSearchQueryChange={partyList.setSearchQuery}
                onAddOption={partyList.addOption}
                onToggleOption={partyList.toggleOption}
                onRemoveOption={partyList.removeOption}
                onClearOptionSelection={partyList.clearOptionSelection}
                onClearAll={partyList.clearFilters}
                filteredCount={partyList.filteredItems.length}
                totalCount={partyList.items.length}
              />
            ) : (
              <ModuleFilterSidebar<tradeRelationshipsApi.FacilityRelationshipRow>
                open={facilityList.sidebarOpen}
                onClose={facilityList.closeSidebar}
                columns={facilityList.filterColumns}
                facets={facilityList.facets}
                filters={facilityList.filters}
                isColumnActive={facilityList.isColumnActive}
                onSearchQueryChange={facilityList.setSearchQuery}
                onAddOption={facilityList.addOption}
                onToggleOption={facilityList.toggleOption}
                onRemoveOption={facilityList.removeOption}
                onClearOptionSelection={facilityList.clearOptionSelection}
                onClearAll={facilityList.clearFilters}
                filteredCount={facilityList.filteredItems.length}
                totalCount={facilityList.items.length}
              />
            )}
            {tab === "party" ? (
              <div className="dash-table-wrap dash-table-wrap--flush">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>{t("relationships.primaryParty")}</th>
                      <th>{t("relationships.primaryRole")}</th>
                      <th>{t("relationships.subsidiaryParty")}</th>
                      <th>{t("relationships.subsidiaryRole")}</th>
                      <th>{t("partyRelationships.thAlias")}</th>
                      <th>{t("relationships.thActions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partyList.filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="dash-table__empty">
                          {t("moduleList.noResults")}
                        </td>
                      </tr>
                    ) : (
                      partyList.filteredItems.map((row) => (
                        <tr key={row.id} className="trade-setup-directory-row">
                          <td>
                            <Link
                              to={partyProfilePath(isClientPortal, row.fromPartyId)}
                              className="party-profile-link"
                            >
                              {row.fromPartyName}
                            </Link>
                            <div>
                              <code className="trade-setup-alias-code">{row.fromPartyCode}</code>
                            </div>
                          </td>
                          <td>{roleCell(row.primaryRole, t)}</td>
                          <td>
                            {row.toPartyId ? (
                              <>
                                <Link
                                  to={partyProfilePath(isClientPortal, row.toPartyId)}
                                  className="party-profile-link"
                                >
                                  {row.toPartyName}
                                </Link>
                                <div>
                                  <code className="trade-setup-alias-code">{row.toPartyCode}</code>
                                </div>
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>{roleCell(row.relationshipType, t)}</td>
                          <td>{row.clientAlias || "—"}</td>
                          <td>
                            <div className="trade-setup-directory-row__name-inner">
                              <button
                                type="button"
                                className="btn btn--ghost btn--sm trade-setup-directory-row__inline-action"
                                onClick={() => openEditPartyRow(row)}
                              >
                                {t("relationships.edit")}
                              </button>
                              <button
                                type="button"
                                className="btn btn--ghost btn--sm btn--danger trade-setup-directory-row__inline-action"
                                disabled={removingId === row.id}
                                onClick={() => void handleRemoveParty(row)}
                              >
                                {t("partyProfile.remove")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="dash-table-wrap dash-table-wrap--flush">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>{t("relationships.primaryParty")}</th>
                      <th>{t("relationships.primaryRole")}</th>
                      <th>{t("facilityRelationships.thFacility")}</th>
                      <th>{t("partyRelationships.thAlias")}</th>
                      <th>{t("relationships.thActions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facilityList.filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="dash-table__empty">
                          {t("moduleList.noResults")}
                        </td>
                      </tr>
                    ) : (
                      facilityList.filteredItems.map((row) => (
                        <tr key={row.id} className="trade-setup-directory-row">
                          <td>
                            <Link
                              to={partyProfilePath(isClientPortal, row.partyId)}
                              className="party-profile-link"
                            >
                              {row.partyName}
                            </Link>
                            <div>
                              <code className="trade-setup-alias-code">{row.partyCode}</code>
                            </div>
                          </td>
                          <td>{roleCell(row.primaryRole, t)}</td>
                          <td>
                            <span className="trade-setup-directory-row__name">{row.facilityName}</span>
                            <div>
                              <code className="trade-setup-alias-code">{row.facilityCode}</code>
                            </div>
                          </td>
                          <td>{row.notes || "—"}</td>
                          <td>
                            <div className="trade-setup-directory-row__name-inner">
                              <button
                                type="button"
                                className="btn btn--ghost btn--sm trade-setup-directory-row__inline-action"
                                onClick={() => openEditFacilityRow(row)}
                              >
                                {t("relationships.edit")}
                              </button>
                              <button
                                type="button"
                                className="btn btn--ghost btn--sm btn--danger trade-setup-directory-row__inline-action"
                                disabled={removingId === row.id}
                                onClick={() => void handleRemoveFacility(row)}
                              >
                                {t("partyProfile.remove")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}

        {!activeList.loading && activeList.showEmptyDataset ? (
          <div className="trade-setup-empty">
            <p className="panel__muted">
              {tab === "party" ? t("relationships.emptyParty") : t("relationships.emptyFacility")}
            </p>
            <div className="trade-setup-empty__actions">
              <button type="button" className="btn btn--primary" onClick={openAddModal}>
                {t("relationships.addButton")}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <RelationshipFormModal
        open={modalOpen}
        mode={modalMode}
        initialScope={tab}
        partyRow={editingPartyRow}
        facilityRow={editingFacilityRow}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </section>
  );
}
