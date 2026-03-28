import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { OverviewSnapshotCards } from "../../components/OverviewSnapshotCards.jsx";
import { TrackContainerView } from "../../components/TrackContainerView.jsx";
import * as containersApi from "../../api/containers.js";
import { DASHBOARD_OVERVIEW_PATH } from "../../config/paths.js";
import { OverviewKpiStrip } from "../../components/OverviewKpiStrip.jsx";
import { useDashboardWorkspace } from "./DashboardWorkspaceContext.jsx";
import { filterOverviewItemsByClient } from "./overviewClientFilter.js";
import { useTranslation } from "../../i18n/LanguageContext.jsx";

const OverviewFleetMap = lazy(() =>
  import("../../components/OverviewFleetMap.jsx").then((m) => ({ default: m.OverviewFleetMap }))
);

const OVERVIEW_MAP_CACHE_KEY = "fb.overviewMap.v5";
const OVERVIEW_MAP_CACHE_MS = 45000;

function readOverviewMapCache() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(OVERVIEW_MAP_CACHE_KEY);
    if (!raw) return null;
    const { at, payload } = JSON.parse(raw);
    if (!payload || Date.now() - at > OVERVIEW_MAP_CACHE_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

function writeOverviewMapCache(payload) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(OVERVIEW_MAP_CACHE_KEY, JSON.stringify({ at: Date.now(), payload }));
  } catch {
    // cuota o modo privado (sessionStorage lleno / denegado)
  }
}

function OverviewMapLoadingSkeleton({ messageKey }) {
  const { t } = useTranslation();
  return (
    <div className="overview-map overview-map--loading" role="status" aria-busy="true">
      <div className="overview-map__loading-inner">
        <div className="dash-loading__spinner" aria-hidden />
        <span>{t(messageKey)}</span>
      </div>
    </div>
  );
}

function normalizeContainerQuery(s) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

// Snapshot “completados sin API” a partir de una fila del workspace.
function workspaceRowToSnapshotItem(row, translate) {
  const id = String(row.id ?? "");
  return {
    savedContainerId: id,
    containerNumber: row.containerNumber,
    ok: true,
    trackingDataSource: "manual",
    entrySource: row.entrySource ?? "manual",
    lifecycleStatus: "completed",
    clientId: row.clientId ? String(row.clientId) : "",
    clientName: row.clientName || "",
    notes: row.notes || "",
    status: "COMPLETED",
    statusLabel: translate("overviewSnapshot.statusCompleted"),
    vesselName: "",
    polPort: "",
    podPort: "",
    polLocode: "",
    podLocode: "",
    etdAt: null,
    etaAt: null,
    routePaths: [],
  };
}

// Snapshot activos sin API (seed / manual / import); no salen en el mapa de flota.
function workspaceActiveNonApiToSnapshotItem(row, translate) {
  const id = String(row.id ?? "");
  const es = row.entrySource ?? "manual";
  return {
    savedContainerId: id,
    containerNumber: row.containerNumber,
    ok: true,
    trackingDataSource: es === "seed" ? "mock" : "manual",
    entrySource: es,
    lifecycleStatus: "active",
    clientId: row.clientId ? String(row.clientId) : "",
    clientName: row.clientName || "",
    notes: row.notes || "",
    status: "SAVED",
    statusLabel: translate("overviewSnapshot.statusNoApiActive"),
    vesselName: "",
    polPort: "",
    podPort: "",
    polLocode: "",
    podLocode: "",
    etdAt: null,
    etaAt: null,
    routePaths: [],
  };
}

export function DashboardOverview() {
  const { t } = useTranslation();
  const {
    isClientPortal,
    overviewStats,
    handleDelete,
    handleUpdateContainer,
    load: reloadWorkspaceContainers,
    items,
    loading,
  } = useDashboardWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mapPayload, setMapPayload] = useState(() => readOverviewMapCache());
  const [mapLoading, setMapLoading] = useState(() => !readOverviewMapCache());
  const [clientFilterKey, setClientFilterKey] = useState("");
  const mapFetchedOnceRef = useRef(false);

  const refreshOverviewMap = useCallback(async () => {
    try {
      const data = await containersApi.fetchContainersOverviewMap();
      setMapPayload(data);
      writeOverviewMapCache(data);
    } catch {
      setMapPayload({ mode: "empty", items: [], itemsCompleted: [], counts: { activeApi: 0, completedApi: 0 } });
    }
  }, []);

  const onTrackRecorded = useCallback(() => {
    void reloadWorkspaceContainers();
    void refreshOverviewMap();
  }, [reloadWorkspaceContainers, refreshOverviewMap]);

  const removeSavedAndRefreshMap = useCallback(
    async (id) => {
      await handleDelete(id);
      await refreshOverviewMap();
    },
    [handleDelete, refreshOverviewMap]
  );

  // Vista previa y mapa: solo activas; mismo filtro de cliente que las tarjetas de abajo.
  const activeOverviewItems = useMemo(() => {
    let list = filterOverviewItemsByClient(mapPayload?.items ?? [], clientFilterKey) ?? [];
    list = list.filter((it) => it.lifecycleStatus !== "completed");
    return list;
  }, [mapPayload, clientFilterKey]);

  const mergedForClientOptions = useMemo(() => {
    const a = mapPayload?.items ?? [];
    const c = mapPayload?.itemsCompleted ?? [];
    const w = (items ?? []).map((r) => ({
      clientName: r.clientName || "",
      containerNumber: r.containerNumber,
      savedContainerId: String(r.id),
      lifecycleStatus: r.lifecycleStatus,
      entrySource: r.entrySource,
    }));
    return [...a, ...c, ...w];
  }, [mapPayload, items]);

  const completedSnapshotItems = useMemo(() => {
    let list = filterOverviewItemsByClient(mapPayload?.itemsCompleted, clientFilterKey) ?? [];
    list = list.filter((it) => it.lifecycleStatus === "completed");
    return list;
  }, [mapPayload, clientFilterKey]);

  const focusQuery = useMemo(() => {
    const q = searchParams.get("q");
    if (!q) return null;
    const trimmed = q.trim();
    if (trimmed.length < 4) return null;
    return normalizeContainerQuery(trimmed);
  }, [searchParams]);

  // Fila guardada que coincide con ?q= (marcar completado desde el mismo tracking).
  const workspaceRowForTrack = useMemo(() => {
    const q = searchParams.get("q");
    if (!q || q.trim().length < 4 || !items?.length) return null;
    const n = normalizeContainerQuery(q);
    return items.find((r) => normalizeContainerQuery(r.containerNumber) === n) ?? null;
  }, [items, searchParams]);

  const patchWorkspaceLifecycle = useCallback(
    async (id, patch) => {
      await handleUpdateContainer(id, patch);
      await refreshOverviewMap();
    },
    [handleUpdateContainer, refreshOverviewMap]
  );

  // Mapa: mismo filtro que la vista previa (solo API activas en el payload del mapa).
  const fleetPayload = useMemo(() => {
    if (!mapPayload) return null;
    return { ...mapPayload, items: activeOverviewItems };
  }, [mapPayload, activeOverviewItems]);

  const completedNonApiSnapshotItems = useMemo(() => {
    const raw = (items ?? []).filter(
      (r) => r.lifecycleStatus === "completed" && r.entrySource !== "api"
    );
    const filtered = filterOverviewItemsByClient(raw, clientFilterKey);
    return filtered.map((r) => workspaceRowToSnapshotItem(r, t));
  }, [items, clientFilterKey, t]);

  const nonApiActiveSnapshotItems = useMemo(() => {
    const raw = (items ?? []).filter(
      (r) => r.lifecycleStatus !== "completed" && r.entrySource !== "api"
    );
    const filtered = filterOverviewItemsByClient(raw, clientFilterKey);
    return filtered.map((r) => workspaceActiveNonApiToSnapshotItem(r, t));
  }, [items, clientFilterKey, t]);

  const hasNonApiCompleted = useMemo(
    () => (items ?? []).some((r) => r.lifecycleStatus === "completed" && r.entrySource !== "api"),
    [items]
  );

  const hasNonApiActive = useMemo(
    () => (items ?? []).some((r) => r.lifecycleStatus !== "completed" && r.entrySource !== "api"),
    [items]
  );

  // Enlace antiguo ?lifecycle=completed: scroll a completados y limpiar query.
  useEffect(() => {
    if (searchParams.get("lifecycle") !== "completed") return;
    if (mapLoading) return;
    const id = window.setTimeout(() => {
      window.location.hash = "overview-completed";
      document.getElementById("overview-completed")?.scrollIntoView({ behavior: "smooth", block: "start" });
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("lifecycle");
          return next;
        },
        { replace: true }
      );
    }, 120);
    return () => window.clearTimeout(id);
  }, [searchParams, mapLoading, setSearchParams]);

  // Volver a pedir el mapa cuando cambie la lista guardada o termine la carga inicial del workspace.
  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    const showSpinner = !mapFetchedOnceRef.current;
    if (showSpinner) setMapLoading(true);
    void (async () => {
      try {
        const data = await containersApi.fetchContainersOverviewMap();
        if (cancelled) return;
        setMapPayload(data);
        writeOverviewMapCache(data);
      } catch {
        if (!cancelled) {
          setMapPayload({ mode: "empty", items: [], itemsCompleted: [], counts: { activeApi: 0, completedApi: 0 } });
        }
      } finally {
        if (!cancelled) {
          setMapLoading(false);
          mapFetchedOnceRef.current = true;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, items]);

  return (
    <section className="panel panel--dash-form" aria-label={t("dashboardPage.overview.ariaSection")}>
      <div id="overview-embedded-track" className="overview-embedded-track">
        <div className="overview-embedded-track__head">
          <h2 className="overview-embedded-track__title">{t("dashboardPage.overview.embeddedTitle")}</h2>
          {focusQuery ? (
            <Link className="overview-embedded-track__clear" to={DASHBOARD_OVERVIEW_PATH}>
              {t("dashboardPage.overview.fullOverviewLink")}
            </Link>
          ) : null}
        </div>
        <p className="sr-only">{t("overview.srTrack")}</p>
        <TrackContainerView
          basePath={DASHBOARD_OVERVIEW_PATH}
          compact
          embedded
          onTrackRecorded={onTrackRecorded}
          workspaceSavedRow={workspaceRowForTrack}
          onWorkspaceLifecycleChange={isClientPortal ? undefined : patchWorkspaceLifecycle}
        />
      </div>

      {!focusQuery && (
        <div className="breakout overview-summary-band">
          <div className="breakout__glow" aria-hidden />
          <div className="overview-summary-band__inner">
            <h2 id="overview-heading" className="overview-summary-band__title">
              <span className="breakout__title-line">{t("dashboardPage.overview.sectionSummary")}</span>
            </h2>
            <OverviewKpiStrip
              workspace={{
                total: overviewStats.total,
                assigned: overviewStats.assigned,
                unassigned: overviewStats.unassigned,
              }}
            />
            {!mapLoading &&
              (mapPayload?.items?.length > 0 ||
                mapPayload?.itemsCompleted?.length > 0 ||
                hasNonApiCompleted ||
                hasNonApiActive) && (
                <OverviewSnapshotCards
                  embedInBreakout
                  items={activeOverviewItems}
                  nonApiActiveItems={nonApiActiveSnapshotItems}
                  historyItems={completedSnapshotItems}
                  completedNonApiItems={completedNonApiSnapshotItems}
                  allItemsForClientOptions={mergedForClientOptions}
                  clientFilterKey={clientFilterKey}
                  onClientFilterKeyChange={setClientFilterKey}
                  isClientPortal={isClientPortal}
                  mode={mapPayload?.mode ?? "empty"}
                  onRemoveSaved={removeSavedAndRefreshMap}
                />
              )}
          </div>
        </div>
      )}

      {!focusQuery ? (
        <div className="overview-fleet-block">
          <div className="panel__head panel__head--map overview-fleet-head">
            <div>
              <h3 className="panel__title">{t("overview.fleetMap")}</h3>
              <p className="overview-map-api-banner" role="status">
                {t("overview.mapShowsApiOnly")}
              </p>
              {clientFilterKey ? (
                <p className="overview-map-scope" role="status">
                  {t("overview.mapFilterHint")}
                </p>
              ) : null}
            </div>
          </div>
          {mapLoading ? (
            <OverviewMapLoadingSkeleton messageKey="overviewMap.loadingFleet" />
          ) : (
            <Suspense fallback={<OverviewMapLoadingSkeleton messageKey="overviewMap.loadingMap" />}>
              <OverviewFleetMap payload={fleetPayload} />
            </Suspense>
          )}
        </div>
      ) : null}
    </section>
  );
}
