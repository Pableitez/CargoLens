import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { colorForContainer } from "../utils/overviewColors.js";
import { UNASSIGNED_FILTER } from "../pages/dashboard/overviewClientFilter.js";
import { DASHBOARD_OVERVIEW_PATH } from "../config/paths.js";
import { useTranslation } from "../i18n/LanguageContext.jsx";
import {
  buildClientGroups,
  clientKey,
  useAccordionBootstrap,
} from "../pages/dashboard/overviewSnapshotGroups.js";

const HEAVY_OVERVIEW_CLIENTS = 4;
const HEAVY_OVERVIEW_ITEMS = 14;
const PREVIEW_CAP = 8;

function formatOverviewDate(iso, dateLocale) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(dateLocale === "es-ES" ? "es-ES" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  } catch {
    return "—";
  }
}

function sortByEtaThenCn(a, b) {
  const ta = a.etaAt ? new Date(a.etaAt).getTime() : Number.POSITIVE_INFINITY;
  const tb = b.etaAt ? new Date(b.etaAt).getTime() : Number.POSITIVE_INFINITY;
  if (ta !== tb) return ta - tb;
  return String(a.containerNumber ?? "").localeCompare(String(b.containerNumber ?? ""));
}

function earliestEtaIso(items) {
  let best = null;
  for (const it of items) {
    if (!it.etaAt) continue;
    const t = new Date(it.etaAt).getTime();
    if (Number.isNaN(t)) continue;
    if (best === null || t < best) best = t;
  }
  return best == null ? null : new Date(best).toISOString();
}

function trackingDataSourceKey(it) {
  return it.trackingDataSource ?? "mock";
}

// Etiqueta de origen: tracking live vs tipo de entrada (API / seed / import / manual).
function getOverviewSourceLabel(it, t) {
  const ds = trackingDataSourceKey(it);
  if (ds === "live") return t("overviewSnapshot.trackingLive");
  const es = it.entrySource;
  if (es === "api") return t("overviewSnapshot.badgeOperatorApi");
  if (es === "seed") return t("overviewSnapshot.badgeDemoSeed");
  if (es === "import") return t("overviewSnapshot.badgeImportSnapshot");
  if (ds === "manual") return t("overviewSnapshot.trackingIllustrative");
  if (ds === "none") return t("overviewSnapshot.trackingNone");
  return t("overviewSnapshot.trackingDemo");
}

function overviewSourceClass(it) {
  if (trackingDataSourceKey(it) === "live") return "live";
  if (it.entrySource === "api") return "entry-api";
  if (it.entrySource === "seed") return "entry-seed";
  if (it.entrySource === "import") return "entry-import";
  return trackingDataSourceKey(it);
}

// Texto concatenado para búsqueda (cliente opcional según modo).
function itemSearchBlob(it, includeClient, tSearch) {
  const src = tSearch(it);
  const parts = [
    it.containerNumber,
    includeClient ? it.clientName : null,
    it.notes,
    it.polPort,
    it.podPort,
    it.polLocode,
    it.podLocode,
    it.statusLabel,
    it.status,
    it.vesselName,
    it.error,
    it.entrySource,
    src,
  ].filter(Boolean);
  return parts.join(" ").toLowerCase();
}

// Con “Todos los clientes”: solo nombre de cliente; con cliente elegido: búsqueda en toda la fila.
function filterSnapshotItemsByQuery(list, query, clientNameOnly, tSearch) {
  const src = list ?? [];
  const q = query.trim().toLowerCase();
  if (!q) return [...src];
  if (clientNameOnly) {
    return src.filter((it) => clientKey(it).toLowerCase().includes(q));
  }
  return src.filter((it) => itemSearchBlob(it, true, tSearch).includes(q));
}

function ContainerRow({ it, isClientPortal, onRemoveSaved }) {
  const { t, dateLocale } = useTranslation();
  const col = colorForContainer(it.containerNumber);
  const ok = it.ok !== false;
  const srcClass = overviewSourceClass(it);
  const srcLabel = getOverviewSourceLabel(it, t);
  const trackTo = `${DASHBOARD_OVERVIEW_PATH}?q=${encodeURIComponent(it.containerNumber)}`;
  return (
    <li className="overview-card">
      <span className="overview-card__swatch" style={{ background: col }} aria-hidden />
      <div className="overview-card__main">
        <div className="overview-card__row overview-card__row--primary">
          <Link
            to={trackTo}
            className={`overview-card__cn${ok ? "" : " overview-card__cn--warn"}`}
          >
              {it.containerNumber}
            </Link>
          <span
            className={`overview-card__src overview-card__src--${srcClass}`}
            title={srcLabel}
          >
            {srcLabel}
          </span>
          <span className={`overview-card__status${ok ? "" : " overview-card__status--bad"}`}>
            {ok ? it.statusLabel || it.status || "—" : it.error || t("overviewSnapshot.noData")}
          </span>
        </div>
        <div className="overview-card__grid">
          <div className="overview-card__cell">
            <span className="overview-card__k">{t("overviewSnapshot.originPol")}</span>
            <span className="overview-card__v">{it.polPort || "—"}</span>
            <span className="overview-card__d">
              {t("overviewSnapshot.etd")} {formatOverviewDate(it.etdAt, dateLocale)}
            </span>
          </div>
          <div className="overview-card__cell">
            <span className="overview-card__k">{t("overviewSnapshot.destinationPod")}</span>
            <span className="overview-card__v">{it.podPort || "—"}</span>
            <span className="overview-card__d">
              {t("overviewSnapshot.eta")} {formatOverviewDate(it.etaAt, dateLocale)}
            </span>
          </div>
          <div className="overview-card__cell overview-card__cell--vessel">
            <span className="overview-card__k">{t("overviewSnapshot.vessel")}</span>
            <span className="overview-card__v">{it.vesselName || "—"}</span>
          </div>
        </div>
        {it.notes ? (
          <p className="overview-card__notes" title={it.notes}>
            {it.notes.length > 120 ? `${it.notes.slice(0, 117)}…` : it.notes}
          </p>
        ) : null}
      </div>
      <div className="overview-card__actions">
        <Link
          className="btn btn--secondary overview-card__cta"
          to={trackTo}
          title={ok ? undefined : t("overviewSnapshot.retryTrackingTitle")}
        >
          {t("track.trackBtn")}
        </Link>
        {!ok && !isClientPortal && it.savedContainerId && onRemoveSaved ? (
          <button
            type="button"
            className="btn btn--ghost btn--sm overview-card__cta-remove"
            onClick={() => {
              onRemoveSaved(it.savedContainerId);
            }}
          >
            {t("overviewSnapshot.removeFromSaved")}
          </button>
      ) : null}
      </div>
    </li>
  );
}

function GroupedClientList({
  groups,
  heavyAccordion,
  expandedGroups,
  toggleGroup,
  visibleInGroup,
  showPerGroupSearch,
  isClientPortal,
  perClientQuery,
  setGroupQuery,
  showAllInGroup,
  setShowAll,
  onRemoveSaved,
  idPrefix,
  ariaLabel,
  rowKeySelector = (it) => it.containerNumber,
}) {
  const { t, dateLocale } = useTranslation();

  return (
    <div className="overview-snapshot__groups" role="region" aria-label={ariaLabel}>
          {groups.map((g, gi) => {
            const visible = visibleInGroup(g.items, g.clientName);
            const nextEta = earliestEtaIso(g.items);
            const clientId = g.items.find((it) => it.clientId)?.clientId;
            const isOpen = !heavyAccordion || expandedGroups.has(g.clientName);
            const showFull = showAllInGroup[g.clientName] === true;
            const needsPreviewCap = visible.length > PREVIEW_CAP;
            const displayed = needsPreviewCap && !showFull ? visible.slice(0, PREVIEW_CAP) : visible;
        const qid = `overview-group-q-${idPrefix}-${gi}`;

            const inner = (
              <>
                {!isClientPortal && showPerGroupSearch && isOpen && heavyAccordion && (
                  <div className="overview-group__search-wrap overview-group__search-wrap--in-panel">
                <label className="overview-snapshot__search-label" htmlFor={qid}>
                      {t("overviewSnapshot.inThisClient")}
                    </label>
                    <input
                  id={qid}
                      type="search"
                      className="field__input overview-group__search"
                      placeholder={t("overviewSnapshot.groupFilterPlaceholder")}
                      value={perClientQuery[g.clientName] ?? ""}
                      onChange={(e) => setGroupQuery(g.clientName, e.target.value)}
                      autoComplete="off"
                      aria-label={t("overviewSnapshot.groupFilterAria", { name: g.clientName })}
                    />
                  </div>
                )}
                {visible.length === 0 ? (
                  <p className="overview-group__empty" role="status">
                    {t("overviewSnapshot.emptyGroupFilter")}
                  </p>
                ) : (
                  <>
                    <ul className="overview-card-list" role="list">
                      {displayed.map((it) => (
                    <ContainerRow
                      key={rowKeySelector(it)}
                      it={it}
                      isClientPortal={isClientPortal}
                      onRemoveSaved={onRemoveSaved}
                    />
                      ))}
                    </ul>
                    {needsPreviewCap && (
                      <div className="overview-preview-more">
                        {showFull ? (
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => setShowAll(g.clientName, false)}
                          >
                            {t("overviewSnapshot.seeLess")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => setShowAll(g.clientName, true)}
                          >
                            {t("overviewSnapshot.seeAllInGroup", { count: visible.length })}
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            );

            if (isClientPortal && showPerGroupSearch === false) {
              return (
                <section key={g.clientName} className="overview-group" aria-label={t("overviewSnapshot.yourContainersAria")}>
                  <h4 className="overview-group__title overview-group__title--solo">
                    <span className="overview-group__name">{t("overviewSnapshot.yourContainers")}</span>
                    <span className="overview-group__count">{g.items.length}</span>
                  </h4>
                  {inner}
                </section>
              );
            }

            if (!heavyAccordion) {
              return (
                <section key={g.clientName} className="overview-group" aria-label={g.clientName}>
                  <div className="overview-group__head">
                    <h4 className="overview-group__title">
                      <span className="overview-group__name">{g.clientName}</span>
                      <span className="overview-group__count">{g.items.length}</span>
                    </h4>
                    {showPerGroupSearch && (
                      <div className="overview-group__search-wrap">
                    <label className="overview-snapshot__search-label" htmlFor={qid}>
                          {t("overviewSnapshot.inThisClient")}
                        </label>
                        <input
                      id={qid}
                          type="search"
                          className="field__input overview-group__search"
                          placeholder={t("overviewSnapshot.groupFilterPlaceholder")}
                          value={perClientQuery[g.clientName] ?? ""}
                          onChange={(e) => setGroupQuery(g.clientName, e.target.value)}
                          autoComplete="off"
                          aria-label={t("overviewSnapshot.groupFilterAria", { name: g.clientName })}
                        />
                      </div>
                    )}
                  </div>
                  {inner}
                </section>
              );
            }

            return (
              <section key={g.clientName} className="overview-group overview-group--accordion" aria-label={g.clientName}>
                <div className="overview-accordion__bar">
                  <button
                    type="button"
                    className="overview-accordion__trigger"
                    aria-expanded={isOpen}
                    onClick={() => toggleGroup(g.clientName)}
                  >
                    <span className="overview-accordion__chevron" aria-hidden data-open={isOpen ? "true" : "false"}>
                      ›
                    </span>
                    <span className="overview-accordion__title">{g.clientName}</span>
                    <span className="overview-accordion__meta">
                      {g.items.length} · {t("overviewSnapshot.nextEta")} {formatOverviewDate(nextEta, dateLocale)}
                    </span>
                  </button>
                  {clientId ? (
                    <Link
                      className="overview-accordion__list-link"
                      to={`/dashboard/list?clientId=${encodeURIComponent(clientId)}`}
                    >
                      {t("overviewSnapshot.fullList")}
                    </Link>
                  ) : (
                    <Link className="overview-accordion__list-link" to="/dashboard/list">
                      {t("overviewSnapshot.fullList")}
                    </Link>
                  )}
                </div>
                {isOpen && <div className="overview-accordion__panel">{inner}</div>}
              </section>
            );
          })}
        </div>
  );
}

export function OverviewSnapshotCards({
  items,
  nonApiActiveItems = [],
  historyItems,
  completedNonApiItems = [],
  allItemsForClientOptions,
  clientFilterKey = "",
  onClientFilterKeyChange,
  isClientPortal,
  mode,
  onRemoveSaved,
  embedInBreakout = false,
}) {
  const { t, dateLocale } = useTranslation();
  const tSearch = useCallback((it) => getOverviewSourceLabel(it, t), [t]);
  const [snapshotTab, setSnapshotTab] = useState("api");
  const [globalQuery, setGlobalQuery] = useState("");
  const [perClientQuery, setPerClientQuery] = useState({});
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());
  const [showAllInGroup, setShowAllInGroup] = useState({});
  const [expandedHistoryGroups, setExpandedHistoryGroups] = useState(() => new Set());
  const [perClientQueryHistory, setPerClientQueryHistory] = useState({});
  const [showAllInGroupHistory, setShowAllInGroupHistory] = useState({});
  const [expandedNonApiActiveGroups, setExpandedNonApiActiveGroups] = useState(() => new Set());
  const [perClientQueryNonApiActive, setPerClientQueryNonApiActive] = useState({});
  const [showAllInGroupNonApiActive, setShowAllInGroupNonApiActive] = useState({});
  const [expandedCompletedNonApiGroups, setExpandedCompletedNonApiGroups] = useState(() => new Set());
  const [perClientQueryCompletedNonApi, setPerClientQueryCompletedNonApi] = useState({});
  const [showAllInGroupCompletedNonApi, setShowAllInGroupCompletedNonApi] = useState({});

  const sortLocale = dateLocale === "es-ES" ? "es" : "en";

  const sourceForOptions = allItemsForClientOptions ?? items;

  const clientOptions = useMemo(() => {
    const s = new Set();
    for (const it of sourceForOptions || []) s.add(clientKey(it));
    return [...s].sort((a, b) => a.localeCompare(b, sortLocale));
  }, [sourceForOptions, sortLocale]);

  const setGroupQuery = useCallback((clientName, value) => {
    setPerClientQuery((prev) => ({ ...prev, [clientName]: value }));
  }, []);

  const setGroupQueryHistory = useCallback((clientName, value) => {
    setPerClientQueryHistory((prev) => ({ ...prev, [clientName]: value }));
  }, []);

  const setGroupQueryNonApiActive = useCallback((clientName, value) => {
    setPerClientQueryNonApiActive((prev) => ({ ...prev, [clientName]: value }));
  }, []);

  const setGroupQueryCompletedNonApi = useCallback((clientName, value) => {
    setPerClientQueryCompletedNonApi((prev) => ({ ...prev, [clientName]: value }));
  }, []);

  const uniqueClientCount = useMemo(() => {
    const s = new Set();
    for (const it of items || []) s.add(clientKey(it));
    return s.size;
  }, [items]);

  const uniqueClientCountHistory = useMemo(() => {
    const s = new Set();
    for (const it of historyItems || []) s.add(clientKey(it));
    return s.size;
  }, [historyItems]);

  const uniqueClientCountNonApiActive = useMemo(() => {
    const s = new Set();
    for (const it of nonApiActiveItems || []) s.add(clientKey(it));
    return s.size;
  }, [nonApiActiveItems]);

  const uniqueClientCountCompletedNonApi = useMemo(() => {
    const s = new Set();
    for (const it of completedNonApiItems || []) s.add(clientKey(it));
    return s.size;
  }, [completedNonApiItems]);

  const showClientDropdown = !isClientPortal && clientOptions.length > 1 && typeof onClientFilterKeyChange === "function";

  const showPerGroupSearch = !isClientPortal && uniqueClientCount > 1 && !clientFilterKey;

  const showPerGroupSearchHistory = !isClientPortal && uniqueClientCountHistory > 1 && !clientFilterKey;

  const showPerGroupSearchNonApiActive = !isClientPortal && uniqueClientCountNonApiActive > 1 && !clientFilterKey;

  const showPerGroupSearchCompletedNonApi = !isClientPortal && uniqueClientCountCompletedNonApi > 1 && !clientFilterKey;

  // Mismo criterio que filterSnapshotItemsByQuery: nombre de cliente vs envío completo.
  const isClientNameSearchMode = showClientDropdown && !clientFilterKey;

  const globalFiltered = useMemo(() => {
    const list = filterSnapshotItemsByQuery(items, globalQuery, isClientNameSearchMode, tSearch);
    list.sort(sortByEtaThenCn);
    return list;
  }, [items, globalQuery, tSearch, isClientNameSearchMode]);

  const historyFiltered = useMemo(() => {
    const list = filterSnapshotItemsByQuery(historyItems, globalQuery, isClientNameSearchMode, tSearch);
    list.sort(sortByEtaThenCn);
    return list;
  }, [historyItems, globalQuery, tSearch, isClientNameSearchMode]);

  const nonApiActiveFiltered = useMemo(() => {
    const list = filterSnapshotItemsByQuery(nonApiActiveItems, globalQuery, isClientNameSearchMode, tSearch);
    list.sort(sortByEtaThenCn);
    return list;
  }, [nonApiActiveItems, globalQuery, tSearch, isClientNameSearchMode]);

  const completedNonApiFiltered = useMemo(() => {
    const list = filterSnapshotItemsByQuery(completedNonApiItems, globalQuery, isClientNameSearchMode, tSearch);
    list.sort(sortByEtaThenCn);
    return list;
  }, [completedNonApiItems, globalQuery, tSearch, isClientNameSearchMode]);

  const groups = useMemo(
    () => buildClientGroups(globalFiltered, sortLocale),
    [globalFiltered, sortLocale]
  );

  const historyGroups = useMemo(
    () => buildClientGroups(historyFiltered, sortLocale),
    [historyFiltered, sortLocale]
  );

  const nonApiActiveGroups = useMemo(
    () => buildClientGroups(nonApiActiveFiltered, sortLocale),
    [nonApiActiveFiltered, sortLocale]
  );

  const completedNonApiGroups = useMemo(
    () => buildClientGroups(completedNonApiFiltered, sortLocale),
    [completedNonApiFiltered, sortLocale]
  );

  const groupNamesKey = groups.map((g) => g.clientName).join("\0");
  const groupNamesKeyHistory = historyGroups.map((g) => g.clientName).join("\0");
  const groupNamesKeyNonApiActive = nonApiActiveGroups.map((g) => g.clientName).join("\0");
  const groupNamesKeyCompletedNonApi = completedNonApiGroups.map((g) => g.clientName).join("\0");

  const heavyAccordion =
    !isClientPortal && (uniqueClientCount >= HEAVY_OVERVIEW_CLIENTS || items.length >= HEAVY_OVERVIEW_ITEMS);

  const heavyAccordionHistory =
    !isClientPortal &&
    (uniqueClientCountHistory >= HEAVY_OVERVIEW_CLIENTS || (historyItems?.length ?? 0) >= HEAVY_OVERVIEW_ITEMS);

  const heavyAccordionNonApiActive =
    !isClientPortal &&
    (uniqueClientCountNonApiActive >= HEAVY_OVERVIEW_CLIENTS || (nonApiActiveItems?.length ?? 0) >= HEAVY_OVERVIEW_ITEMS);

  const heavyAccordionCompletedNonApi =
    !isClientPortal &&
    (uniqueClientCountCompletedNonApi >= HEAVY_OVERVIEW_CLIENTS ||
      (completedNonApiItems?.length ?? 0) >= HEAVY_OVERVIEW_ITEMS);

  useEffect(() => {
    const sync = () => {
      if (window.location.hash.replace(/^#/, "") === "overview-completed") {
        setSnapshotTab("completed");
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    if (snapshotTab !== "completed") return;
    if (window.location.hash.replace(/^#/, "") !== "overview-completed") return;
    const scrollTimer = window.setTimeout(() => {
      document.getElementById("overview-completed")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(scrollTimer);
  }, [snapshotTab]);

  useAccordionBootstrap(groups, heavyAccordion, groupNamesKey, setExpandedGroups);
  useAccordionBootstrap(historyGroups, heavyAccordionHistory, groupNamesKeyHistory, setExpandedHistoryGroups);
  useAccordionBootstrap(
    nonApiActiveGroups,
    heavyAccordionNonApiActive,
    groupNamesKeyNonApiActive,
    setExpandedNonApiActiveGroups
  );
  useAccordionBootstrap(
    completedNonApiGroups,
    heavyAccordionCompletedNonApi,
    groupNamesKeyCompletedNonApi,
    setExpandedCompletedNonApiGroups
  );

  const toggleGroup = useCallback((name) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const expandAllGroups = useCallback(() => {
    setExpandedGroups(new Set(groups.map((g) => g.clientName)));
  }, [groups]);

  const collapseAllGroups = useCallback(() => {
    setExpandedGroups(new Set());
  }, []);

  const toggleHistoryGroup = useCallback((name) => {
    setExpandedHistoryGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const expandAllHistoryGroups = useCallback(() => {
    setExpandedHistoryGroups(new Set(historyGroups.map((g) => g.clientName)));
  }, [historyGroups]);

  const collapseAllHistoryGroups = useCallback(() => {
    setExpandedHistoryGroups(new Set());
  }, []);

  const toggleNonApiActiveGroup = useCallback((name) => {
    setExpandedNonApiActiveGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const expandAllNonApiActiveGroups = useCallback(() => {
    setExpandedNonApiActiveGroups(new Set(nonApiActiveGroups.map((g) => g.clientName)));
  }, [nonApiActiveGroups]);

  const collapseAllNonApiActiveGroups = useCallback(() => {
    setExpandedNonApiActiveGroups(new Set());
  }, []);

  const toggleCompletedNonApiGroup = useCallback((name) => {
    setExpandedCompletedNonApiGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const expandAllCompletedNonApiGroups = useCallback(() => {
    setExpandedCompletedNonApiGroups(new Set(completedNonApiGroups.map((g) => g.clientName)));
  }, [completedNonApiGroups]);

  const collapseAllCompletedNonApiGroups = useCallback(() => {
    setExpandedCompletedNonApiGroups(new Set());
  }, []);

  const visibleInGroup = useCallback(
    (groupItems, clientName) => {
      if (!showPerGroupSearch) return groupItems;
      const q = (perClientQuery[clientName] ?? "").trim().toLowerCase();
      if (!q) return groupItems;
      return groupItems.filter((it) => itemSearchBlob(it, false, tSearch).includes(q));
    },
    [perClientQuery, showPerGroupSearch, tSearch]
  );

  const visibleInHistoryGroup = useCallback(
    (groupItems, clientName) => {
      if (!showPerGroupSearchHistory) return groupItems;
      const q = (perClientQueryHistory[clientName] ?? "").trim().toLowerCase();
      if (!q) return groupItems;
      return groupItems.filter((it) => itemSearchBlob(it, false, tSearch).includes(q));
    },
    [perClientQueryHistory, showPerGroupSearchHistory, tSearch]
  );

  const visibleInNonApiActiveGroup = useCallback(
    (groupItems, clientName) => {
      if (!showPerGroupSearchNonApiActive) return groupItems;
      const q = (perClientQueryNonApiActive[clientName] ?? "").trim().toLowerCase();
      if (!q) return groupItems;
      return groupItems.filter((it) => itemSearchBlob(it, false, tSearch).includes(q));
    },
    [perClientQueryNonApiActive, showPerGroupSearchNonApiActive, tSearch]
  );

  const visibleInCompletedNonApiGroup = useCallback(
    (groupItems, clientName) => {
      if (!showPerGroupSearchCompletedNonApi) return groupItems;
      const q = (perClientQueryCompletedNonApi[clientName] ?? "").trim().toLowerCase();
      if (!q) return groupItems;
      return groupItems.filter((it) => itemSearchBlob(it, false, tSearch).includes(q));
    },
    [perClientQueryCompletedNonApi, showPerGroupSearchCompletedNonApi, tSearch]
  );

  const setShowAll = useCallback((clientName, value) => {
    setShowAllInGroup((prev) => ({ ...prev, [clientName]: value }));
  }, []);

  const setShowAllHistory = useCallback((clientName, value) => {
    setShowAllInGroupHistory((prev) => ({ ...prev, [clientName]: value }));
  }, []);

  const setShowAllNonApiActive = useCallback((clientName, value) => {
    setShowAllInGroupNonApiActive((prev) => ({ ...prev, [clientName]: value }));
  }, []);

  const setShowAllCompletedNonApi = useCallback((clientName, value) => {
    setShowAllInGroupCompletedNonApi((prev) => ({ ...prev, [clientName]: value }));
  }, []);

  const historyRowKey = useCallback(
    (it) => (it.savedContainerId ? String(it.savedContainerId) : it.containerNumber),
    []
  );

  if (
    !sourceForOptions?.length &&
    !historyItems?.length &&
    !(nonApiActiveItems?.length > 0) &&
    !(completedNonApiItems?.length > 0)
  ) {
    return null;
  }

  const showHeavySubtitle =
    heavyAccordion || heavyAccordionHistory || heavyAccordionNonApiActive || heavyAccordionCompletedNonApi;

  const globalFilterEmptyMsg =
    isClientNameSearchMode && globalQuery.trim()
      ? t("overviewSnapshot.emptyClientNameSearch")
      : t("overviewSnapshot.emptySearch");

  const rootClass = `overview-snapshot${embedInBreakout ? " overview-snapshot--in-breakout" : ""}`;

  return (
    <div className={rootClass} id="overview-snapshot">
      <div className={`overview-snapshot__head${embedInBreakout ? " overview-snapshot__head--breakout" : ""}`}>
        <div>
          <h3 className="overview-snapshot__title">{t("overviewSnapshot.title")}</h3>
          {showHeavySubtitle && !embedInBreakout ? (
            <p className="overview-snapshot__subtitle overview-snapshot__subtitle--solo">
              {t("overviewSnapshot.subtitleHeavy")}
            </p>
          ) : null}
        </div>
        {mode === "mock" && (
          <p className="overview-snapshot__badge" role="status">
            {t("overviewSnapshot.demoBadge")}
          </p>
        )}
      </div>

      <div
        className={`overview-snapshot__controls${embedInBreakout ? " overview-snapshot__controls--breakout" : ""}`}
      >
        <div
          className={`overview-snapshot__filters${showClientDropdown ? " overview-snapshot__filters--with-client" : ""}`}
        >
          {showClientDropdown ? (
            <div className="overview-snapshot__field overview-snapshot__field--client">
              <label className="sr-only" htmlFor="overview-client-filter">
                {t("overviewSnapshot.clientLabel")}
              </label>
              <select
                id="overview-client-filter"
                className="field__input overview-snapshot__client-select"
                value={clientFilterKey === UNASSIGNED_FILTER ? UNASSIGNED_FILTER : clientFilterKey}
                onChange={(e) => onClientFilterKeyChange(e.target.value)}
              >
                <option value="">{t("overviewSnapshot.allClients")}</option>
                {clientOptions.map((c) => (
                  <option key={c} value={c === "Unassigned" ? UNASSIGNED_FILTER : c}>
                    {c === "Unassigned" ? t("overviewSnapshot.unassigned") : c}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="overview-snapshot__field overview-snapshot__field--search">
            <label className="sr-only" htmlFor="overview-snapshot-q">
              {t(
                isClientNameSearchMode ? "overviewSnapshot.clientSearchLabel" : "overviewSnapshot.searchLabel"
              )}
            </label>
            <input
              id="overview-snapshot-q"
              type="search"
              className="field__input overview-snapshot__search"
              placeholder={t(
                isClientNameSearchMode
                  ? "overviewSnapshot.clientSearchPlaceholder"
                  : "overviewSnapshot.searchPlaceholder"
              )}
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="overview-snapshot__tabs" role="tablist" aria-label={t("overviewSnapshot.tabsAria")}>
          <button
            type="button"
            className={`overview-snapshot__tab${snapshotTab === "api" ? " overview-snapshot__tab--active" : ""}`}
            role="tab"
            aria-selected={snapshotTab === "api"}
            id="overview-tab-api"
            aria-controls="overview-panel-api"
            onClick={() => setSnapshotTab("api")}
          >
            <span className="overview-snapshot__tab-label">{t("overviewSnapshot.tabApi")}</span>
            <span className="overview-snapshot__tab-count">{items.length}</span>
          </button>
          <button
            type="button"
            className={`overview-snapshot__tab${snapshotTab === "nonApi" ? " overview-snapshot__tab--active" : ""}`}
            role="tab"
            aria-selected={snapshotTab === "nonApi"}
            id="overview-tab-non-api"
            aria-controls="overview-panel-non-api"
            onClick={() => setSnapshotTab("nonApi")}
          >
            <span className="overview-snapshot__tab-label">{t("overviewSnapshot.tabNonApi")}</span>
            <span className="overview-snapshot__tab-count">{nonApiActiveItems.length}</span>
          </button>
          <button
            type="button"
            className={`overview-snapshot__tab${snapshotTab === "completed" ? " overview-snapshot__tab--active" : ""}`}
            role="tab"
            aria-selected={snapshotTab === "completed"}
            id="overview-tab-completed"
            aria-controls="overview-completed"
            onClick={() => setSnapshotTab("completed")}
          >
            <span className="overview-snapshot__tab-label">{t("overviewSnapshot.tabCompleted")}</span>
            <span className="overview-snapshot__tab-count">
              {(historyItems?.length ?? 0) + (completedNonApiItems?.length ?? 0)}
            </span>
          </button>
        </div>

        {snapshotTab === "nonApi" ? (
          <p className="overview-snapshot__tab-hint overview-snapshot__tab-hint--compact" role="note">
            {t("overviewSnapshot.tabNonApiHint")}
          </p>
        ) : null}
      </div>

      {snapshotTab === "api" ? (
        <div
          id="overview-panel-api"
          role="tabpanel"
          aria-labelledby="overview-tab-api"
          className="overview-snapshot__tab-panel"
        >
          {items.length === 0 ? (
            <p className="overview-snapshot__empty" role="status">
              {t("overviewSnapshot.emptyTabApi")}
            </p>
          ) : globalFiltered.length === 0 ? (
            <p className="overview-snapshot__empty" role="status">
              {globalFilterEmptyMsg}
            </p>
          ) : (
            <>
              {heavyAccordion && groups.length > 0 ? (
                <div className="overview-snapshot__accordion-actions overview-snapshot__accordion-actions--section">
                  <button type="button" className="btn btn--ghost btn--sm" onClick={expandAllGroups}>
                    {t("overviewSnapshot.expandAll")}
                  </button>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={collapseAllGroups}>
                    {t("overviewSnapshot.collapseAll")}
                  </button>
                </div>
              ) : null}
              <GroupedClientList
                groups={groups}
                heavyAccordion={heavyAccordion}
                expandedGroups={expandedGroups}
                toggleGroup={toggleGroup}
                visibleInGroup={visibleInGroup}
                showPerGroupSearch={showPerGroupSearch}
                isClientPortal={isClientPortal}
                perClientQuery={perClientQuery}
                setGroupQuery={setGroupQuery}
                showAllInGroup={showAllInGroup}
                setShowAll={setShowAll}
                onRemoveSaved={onRemoveSaved}
                idPrefix="a"
                ariaLabel={t("overviewSnapshot.groupsRegionAria")}
              />
            </>
          )}
        </div>
      ) : null}

      {snapshotTab === "nonApi" ? (
        <div
          id="overview-panel-non-api"
          role="tabpanel"
          aria-labelledby="overview-tab-non-api"
          className="overview-snapshot__tab-panel"
        >
          {nonApiActiveItems.length === 0 ? (
            <p className="overview-snapshot__empty" role="status">
              {t("overviewSnapshot.emptyTabNonApi")}
            </p>
          ) : nonApiActiveFiltered.length === 0 ? (
            <p className="overview-snapshot__empty" role="status">
              {globalFilterEmptyMsg}
            </p>
          ) : (
            <>
              {heavyAccordionNonApiActive && nonApiActiveGroups.length > 0 ? (
                <div className="overview-snapshot__accordion-actions overview-snapshot__accordion-actions--section">
                  <button type="button" className="btn btn--ghost btn--sm" onClick={expandAllNonApiActiveGroups}>
                    {t("overviewSnapshot.expandAll")}
                  </button>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={collapseAllNonApiActiveGroups}>
                    {t("overviewSnapshot.collapseAll")}
                  </button>
                </div>
              ) : null}
              <GroupedClientList
                groups={nonApiActiveGroups}
                heavyAccordion={heavyAccordionNonApiActive}
                expandedGroups={expandedNonApiActiveGroups}
                toggleGroup={toggleNonApiActiveGroup}
                visibleInGroup={visibleInNonApiActiveGroup}
                showPerGroupSearch={showPerGroupSearchNonApiActive}
                isClientPortal={isClientPortal}
                perClientQuery={perClientQueryNonApiActive}
                setGroupQuery={setGroupQueryNonApiActive}
                showAllInGroup={showAllInGroupNonApiActive}
                setShowAll={setShowAllNonApiActive}
                onRemoveSaved={onRemoveSaved}
                idPrefix="s"
                ariaLabel={t("overviewSnapshot.groupsRegionAriaNonApiActive")}
                rowKeySelector={historyRowKey}
              />
            </>
          )}
        </div>
      ) : null}

      {snapshotTab === "completed" ? (
        <div
          id="overview-completed"
          role="tabpanel"
          aria-labelledby="overview-tab-completed"
          className="overview-snapshot__tab-panel overview-snapshot__completed-region"
        >
          <div className="overview-snapshot__completed-stack">
            {historyItems?.length > 0 ? (
              <section className="overview-snapshot__history" aria-labelledby="overview-completed-api-title">
                <h3 className="overview-snapshot__history-title" id="overview-completed-api-title">
                  {t("overviewSnapshot.sectionCompleted")}
                </h3>
                <p className="overview-snapshot__history-note">{t("overviewSnapshot.historyNote")}</p>
                {heavyAccordionHistory && historyGroups.length > 0 ? (
                  <div className="overview-snapshot__accordion-actions overview-snapshot__accordion-actions--section">
                    <button type="button" className="btn btn--ghost btn--sm" onClick={expandAllHistoryGroups}>
                      {t("overviewSnapshot.expandAll")}
                    </button>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={collapseAllHistoryGroups}>
                      {t("overviewSnapshot.collapseAll")}
                    </button>
                  </div>
                ) : null}
                {historyFiltered.length === 0 ? (
                  <p className="overview-snapshot__empty" role="status">
                    {globalFilterEmptyMsg}
                  </p>
                ) : (
                  <GroupedClientList
                    groups={historyGroups}
                    heavyAccordion={heavyAccordionHistory}
                    expandedGroups={expandedHistoryGroups}
                    toggleGroup={toggleHistoryGroup}
                    visibleInGroup={visibleInHistoryGroup}
                    showPerGroupSearch={showPerGroupSearchHistory}
                    isClientPortal={isClientPortal}
                    perClientQuery={perClientQueryHistory}
                    setGroupQuery={setGroupQueryHistory}
                    showAllInGroup={showAllInGroupHistory}
                    setShowAll={setShowAllHistory}
                    onRemoveSaved={onRemoveSaved}
                    idPrefix="h"
                    ariaLabel={t("overviewSnapshot.groupsRegionAriaCompleted")}
                    rowKeySelector={historyRowKey}
                  />
                )}
              </section>
            ) : null}
            {completedNonApiItems?.length > 0 ? (
              <section
                className="overview-snapshot__history overview-snapshot__history--non-api"
                aria-labelledby="overview-completed-non-api-title"
              >
                <h3 className="overview-snapshot__history-title" id="overview-completed-non-api-title">
                  {t("overviewSnapshot.sectionCompletedNonApi")}
                </h3>
                <p className="overview-snapshot__history-note">{t("overviewSnapshot.completedNonApiNote")}</p>
                {heavyAccordionCompletedNonApi && completedNonApiGroups.length > 0 ? (
                  <div className="overview-snapshot__accordion-actions overview-snapshot__accordion-actions--section">
                    <button type="button" className="btn btn--ghost btn--sm" onClick={expandAllCompletedNonApiGroups}>
                      {t("overviewSnapshot.expandAll")}
                    </button>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={collapseAllCompletedNonApiGroups}>
                      {t("overviewSnapshot.collapseAll")}
                    </button>
                  </div>
                ) : null}
                {completedNonApiFiltered.length === 0 ? (
                  <p className="overview-snapshot__empty" role="status">
                    {globalFilterEmptyMsg}
                  </p>
                ) : (
                  <GroupedClientList
                    groups={completedNonApiGroups}
                    heavyAccordion={heavyAccordionCompletedNonApi}
                    expandedGroups={expandedCompletedNonApiGroups}
                    toggleGroup={toggleCompletedNonApiGroup}
                    visibleInGroup={visibleInCompletedNonApiGroup}
                    showPerGroupSearch={showPerGroupSearchCompletedNonApi}
                    isClientPortal={isClientPortal}
                    perClientQuery={perClientQueryCompletedNonApi}
                    setGroupQuery={setGroupQueryCompletedNonApi}
                    showAllInGroup={showAllInGroupCompletedNonApi}
                    setShowAll={setShowAllCompletedNonApi}
                    onRemoveSaved={onRemoveSaved}
                    idPrefix="c"
                    ariaLabel={t("overviewSnapshot.groupsRegionAriaCompletedNonApi")}
                    rowKeySelector={historyRowKey}
                  />
                )}
              </section>
            ) : null}
            {!(historyItems?.length > 0) && !(completedNonApiItems?.length > 0) ? (
              <p className="overview-snapshot__empty" role="status">
                {t("overviewSnapshot.emptyTabCompleted")}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
