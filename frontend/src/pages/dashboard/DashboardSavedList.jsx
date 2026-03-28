import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DASHBOARD_OVERVIEW_PATH } from "../../config/paths.js";
import { PageBreadcrumb } from "../../components/PageBreadcrumb.jsx";
import { DashboardPageSkeleton } from "../../components/DashboardPageSkeleton.jsx";
import { useDashboardWorkspace } from "./DashboardWorkspaceContext.jsx";
import { downloadSavedContainersCsv, formatShortDate } from "./dashboardUtils.js";
import { useTranslation } from "../../i18n/LanguageContext.jsx";

const PAGE_SIZE = 12;

function filterSavedListByKpi(rows, scope, source) {
  let out = rows;
  if (scope === "assigned") out = out.filter((r) => r.clientId);
  else if (scope === "unassigned") out = out.filter((r) => !r.clientId);
  if (source === "manual") out = out.filter((r) => r.entrySource === "manual");
  else if (source === "import") out = out.filter((r) => r.entrySource === "import");
  else if (source === "seed") out = out.filter((r) => r.entrySource === "seed");
  else if (source === "api") out = out.filter((r) => r.entrySource === "api");
  return out;
}

function EditableNotesCell({ row, onPatch }) {
  const { t } = useTranslation();
  const [v, setV] = useState(row.notes || "");
  useEffect(() => {
    setV(row.notes || "");
  }, [row.id, row.notes, row.updatedAt]);

  return (
    <input
      type="text"
      className="field__input dash-table__inline-input"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        const next = v.trim();
        const prev = (row.notes || "").trim();
        if (next !== prev) onPatch({ notes: next });
      }}
      aria-label={t("dashboardPage.list.notesFor", { cn: row.containerNumber })}
    />
  );
}

export function DashboardSavedList() {
  const { t } = useTranslation();
  const {
    user,
    isClientPortal,
    items,
    clients,
    clientFilter,
    setClientFilter,
    clientIdFilter,
    setClientIdFilter,
    loading,
    filteredItems,
    handleDelete,
    handleUpdateContainer,
  } = useDashboardWorkspace();

  const [searchParams] = useSearchParams();
  const scope = searchParams.get("scope");
  const source = searchParams.get("source");

  const kpiFilterActive =
    scope === "assigned" ||
    scope === "unassigned" ||
    source === "manual" ||
    source === "import" ||
    source === "seed" ||
    source === "api";

  const listFiltered = useMemo(
    () => filterSavedListByKpi(filteredItems, scope, source),
    [filteredItems, scope, source]
  );

  const filterDetailParts = useMemo(() => {
    const parts = [];
    if (scope === "assigned") parts.push(t("dashboardPage.list.filterDetailAssigned"));
    if (scope === "unassigned") parts.push(t("dashboardPage.list.filterDetailUnassigned"));
    if (source === "manual") parts.push(t("dashboardPage.list.filterDetailManual"));
    if (source === "import") parts.push(t("dashboardPage.list.filterDetailImport"));
    if (source === "seed") parts.push(t("dashboardPage.list.filterDetailSeed"));
    if (source === "api") parts.push(t("dashboardPage.list.filterDetailApi"));
    return parts.join(" · ");
  }, [scope, source, t]);

  const clearListUrl = useMemo(() => {
    if (!clientIdFilter) return "/dashboard/list";
    return `/dashboard/list?clientId=${encodeURIComponent(clientIdFilter)}`;
  }, [clientIdFilter]);

  const [page, setPage] = useState(0);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(listFiltered.length / PAGE_SIZE)),
    [listFiltered.length]
  );

  useEffect(() => {
    setPage(0);
  }, [clientFilter, clientIdFilter, filteredItems.length, scope, source]);

  useEffect(() => {
    if (page > pageCount - 1) setPage(Math.max(0, pageCount - 1));
  }, [page, pageCount]);

  const pagedRows = useMemo(() => {
    const start = page * PAGE_SIZE;
    return listFiltered.slice(start, start + PAGE_SIZE);
  }, [listFiltered, page]);

  return (
    <section className="dash__table-section" aria-labelledby="list-heading">
      <PageBreadcrumb
        items={[
          { label: t("workspace.section.overview.topbar"), to: "/dashboard/overview" },
          { label: t("workspace.section.list.headline") },
        ]}
      />
      {isClientPortal && user?.clientInviteCode && (
        <div className="panel__callout panel__callout--mb" role="note">
          <span className="panel__callout-label">{t("dashboardPage.list.teamInvite")}</span> {t("dashboardPage.list.teamInviteBody")}{" "}
          <strong>{user?.clientName}</strong>: <code className="dash__code">{user.clientInviteCode}</code>
        </div>
      )}
      <div className="dash__table-head dash__table-head--row">
        <div>
          <h2 id="list-heading" className="dash__table-title">
            {isClientPortal ? t("dashboardPage.list.titleShared") : t("dashboardPage.list.titleSaved")}
          </h2>
          {!loading && items.length > 0 && (
            <p className="dash__table-meta">
              {t("dashboardPage.list.metaRows", { filtered: listFiltered.length, total: items.length })}
              {clientFilter.trim() ? t("dashboardPage.list.metaFilter") : ""}
            </p>
          )}
        </div>
        {!loading && listFiltered.length > 0 && (
          <div className="dash__table-actions no-print">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => downloadSavedContainersCsv(listFiltered)}
            >
              {t("dashboardPage.list.exportCsv")}
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => window.print()}>
              {t("dashboardPage.list.print")}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <DashboardPageSkeleton rows={8} />
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon" aria-hidden>
            ◈
          </div>
          <p className="empty-state__title">{t("dashboardPage.list.emptyTitle")}</p>
          <p className="empty-state__body">
            {isClientPortal ? (
              <>
                {t("dashboardPage.list.emptyPortalBefore")}
                <strong>{user?.clientName}</strong>
                {t("dashboardPage.list.emptyPortalAfter")}
                <Link to="/">{t("dashboardPage.list.emptyPortalSearch")}</Link>
                {t("dashboardPage.list.emptyPortalEnd")}
              </>
            ) : (
              <>
                {t("dashboardPage.list.emptyStaffLead")}{" "}
                <Link to="/dashboard/add" className="empty-hint__link">
                  {t("dashboardPage.list.addContainer")}
                </Link>
                {t("dashboardPage.list.emptyStaffOr")}{" "}
                <Link to="/dashboard/import" className="empty-hint__link">
                  {t("dashboardPage.list.importExcel")}
                </Link>
                {t("dashboardPage.list.emptyStaffTail")}{" "}
                <Link to="/">{t("dashboardPage.list.publicSearch")}</Link>.
              </>
            )}
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state empty-state--compact">
          <p className="empty-state__body">{t("dashboardPage.list.emptyFilter")}</p>
        </div>
      ) : listFiltered.length === 0 && kpiFilterActive ? (
        <div className="empty-state empty-state--compact">
          <p className="empty-state__body">{t("dashboardPage.list.emptyKpiFilter")}</p>
          <p className="empty-state__body">
            <Link className="empty-hint__link" to={clearListUrl}>
              {t("dashboardPage.list.clearKpiFilter")}
            </Link>
          </p>
        </div>
      ) : (
        <>
          {kpiFilterActive && filterDetailParts ? (
            <div className="panel__callout panel__callout--mb" role="status">
              {t("dashboardPage.list.filterKpiBanner", { detail: filterDetailParts })}{" "}
              <Link className="dash-link" to={clearListUrl}>
                {t("dashboardPage.list.clearKpiFilter")}
              </Link>
            </div>
          ) : null}
          <div className="dash-filters">
            {!isClientPortal && clients.length > 0 && (
              <div className="field field--filter">
                <label className="field__label" htmlFor="dash-client-filter">
                  {t("dashboardPage.list.filterClient")}
                </label>
                <select
                  id="dash-client-filter"
                  className="field__input"
                  value={clientIdFilter}
                  onChange={(e) => setClientIdFilter(e.target.value)}
                >
                  <option value="">{t("dashboardPage.list.allClients")}</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="field field--filter">
              <label className="field__label" htmlFor="dash-filter">
                {t("dashboardPage.list.filterName")}
              </label>
              <input
                id="dash-filter"
                className="field__input field__input--filter"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                placeholder={t("dashboardPage.list.filterPlaceholder")}
              />
            </div>
          </div>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th scope="col">{t("dashboardPage.list.thContainer")}</th>
                  <th scope="col">{t("dashboardPage.list.thSource")}</th>
                  <th scope="col">{t("dashboardPage.list.thClient")}</th>
                  <th scope="col">{t("dashboardPage.list.thNotes")}</th>
                  <th scope="col">{t("dashboardPage.list.thAdded")}</th>
                  <th scope="col">{t("dashboardPage.list.thUpdated")}</th>
                  {!isClientPortal && <th scope="col">{t("dashboardPage.list.thLifecycle")}</th>}
                  {!isClientPortal && (
                    <th scope="col">
                      <span className="sr-only">{t("dashboardPage.list.thActions")}</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link className="dash-link" to={`${DASHBOARD_OVERVIEW_PATH}?q=${encodeURIComponent(row.containerNumber)}`}>
                        {row.containerNumber}
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`dash-table__source dash-table__source--${
                          row.entrySource === "import"
                            ? "import"
                            : row.entrySource === "seed"
                              ? "seed"
                              : row.entrySource === "api"
                                ? "api"
                                : "manual"
                        }`}
                      >
                        {row.entrySource === "import"
                          ? t("dashboardPage.list.badgeImport")
                          : row.entrySource === "seed"
                            ? t("dashboardPage.list.badgeSeed")
                            : row.entrySource === "api"
                              ? t("dashboardPage.list.badgeApi")
                              : t("dashboardPage.list.badgeManual")}
                      </span>
                    </td>
                    <td>
                      {!isClientPortal ? (
                        <select
                          className="field__input dash-table__inline-select"
                          value={row.clientId || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            handleUpdateContainer(row.id, { clientId: v === "" ? "" : v }).catch(() => {});
                          }}
                          aria-label={t("dashboardPage.list.clientFor", { cn: row.containerNumber })}
                        >
                          <option value="">{t("dashboardPage.list.unassigned")}</option>
                          {clients.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        row.clientName || "—"
                      )}
                    </td>
                    <td className="dash-table__notes">
                      {!isClientPortal ? (
                        <EditableNotesCell row={row} onPatch={(patch) => void handleUpdateContainer(row.id, patch)} />
                      ) : (
                        row.notes || "—"
                      )}
                    </td>
                    <td className="dash-table__date">{formatShortDate(row.createdAt)}</td>
                    <td className="dash-table__date">{formatShortDate(row.updatedAt)}</td>
                    {!isClientPortal && (
                      <td>
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => {
                            handleUpdateContainer(row.id, {
                              lifecycleStatus: row.lifecycleStatus === "completed" ? "active" : "completed",
                            }).catch(() => {});
                          }}
                        >
                          {row.lifecycleStatus === "completed"
                            ? t("dashboardPage.list.reopenActive")
                            : t("dashboardPage.list.markCompleted")}
                        </button>
                      </td>
                    )}
                    {!isClientPortal && (
                      <td>
                        <button type="button" className="btn btn--danger btn--sm" onClick={() => handleDelete(row.id)}>
                          {t("dashboardPage.list.remove")}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageCount > 1 && (
            <div className="dash-pagination" role="navigation" aria-label={t("dashboardPage.list.paginationAria")}>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                {t("dashboardPage.list.prev")}
              </button>
              <span className="dash-pagination__meta">
                {t("dashboardPage.list.pageMeta", { page: page + 1, total: pageCount, rows: listFiltered.length })}
              </span>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              >
                {t("dashboardPage.list.next")}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
