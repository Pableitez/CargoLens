import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BrandMark } from "./BrandMark.jsx";
import { MainLayout } from "../layouts/MainLayout.jsx";
import { appName } from "../config/siteMeta.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { SearchBar } from "./SearchBar.jsx";
import { SavedContainerTrackPicker } from "./SavedContainerTrackPicker.jsx";
import { Timeline } from "./Timeline.jsx";
import { ShipmentHeader } from "./ShipmentHeader.jsx";
import { ContainerMetaCard } from "./ContainerMetaCard.jsx";
import { VesselCard } from "./VesselCard.jsx";
import { RouteMilestones } from "./RouteMilestones.jsx";
import { MapPanel } from "./MapPanel.jsx";
import { LocationsBar } from "./LocationsBar.jsx";
import { LoadingSkeleton } from "./LoadingSkeleton.jsx";
import { CollapsiblePanel } from "./CollapsiblePanel.jsx";
import { useTranslation } from "../i18n/LanguageContext.jsx";
import { useTrackingSearch } from "../hooks/useTrackingSearch.js";
import { HomeLandingSections } from "./HomeLandingSections.jsx";
import { TrackGuestPromo } from "./TrackGuestPromo.jsx";

// Seguimiento por contenedor: página pública o bloque embebido en el resumen del dashboard.
export function TrackContainerView({
  basePath,
  compact = false,
  embedded = false,
  onTrackRecorded,
  workspaceSavedRow = null,
  onWorkspaceLifecycleChange,
}) {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const overviewEmbed = compact && embedded;
  const { data, loading, error, search, clear, hydrateFromSession } = useTrackingSearch({
    persistSession: overviewEmbed,
  });
  const prevQRef = useRef(undefined);

  function normalizeCn(s) {
    return String(s ?? "")
      .trim()
      .replace(/\s+/g, "")
      .toUpperCase();
  }

  // Home público: si hay ?q= con ISO válido, cargar; si no, vaciar.
  useEffect(() => {
    if (overviewEmbed) return;
    const q = searchParams.get("q");
    if (q && q.trim().length >= 4) {
      search(q.trim()).catch(() => {});
    } else {
      clear();
    }
  }, [searchParams, search, clear, overviewEmbed]);

  // Embebido en overview: alinear estado con ?q= y rehidratar desde sessionStorage (un solo efecto evita carreras clear/hydrate).
  useEffect(() => {
    if (!overviewEmbed) return;
    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 4) {
      if (!loading) clear();
      prevQRef.current = undefined;
      return;
    }
    if (prevQRef.current !== undefined && prevQRef.current !== q && !loading) {
      clear();
    }
    prevQRef.current = q;
    if (loading) return;
    const want = normalizeCn(q);
    const have = data?.containerNumber ? normalizeCn(data.containerNumber) : "";
    if (have === want) return;
    hydrateFromSession(q);
  }, [searchParams, overviewEmbed, clear, loading, data, hydrateFromSession]);

  const qTrim = searchParams.get("q")?.trim() ?? "";
  const normalizedQ = qTrim.length >= 4 ? normalizeCn(qTrim) : "";
  const normalizedDataCn = data?.containerNumber ? normalizeCn(data.containerNumber) : "";
  const showTrackingResults = Boolean(
    data && !loading && normalizedQ.length >= 4 && normalizedDataCn === normalizedQ
  );
  const showPendingOperatorLoad =
    overviewEmbed && normalizedQ.length >= 4 && !loading && !showTrackingResults;

  function goQuery(queryStr) {
    const searchStr = `?q=${encodeURIComponent(queryStr)}`;
    navigate(`${basePath}${searchStr}`, { replace: true });
  }

  async function handleSearchSubmit(q) {
    const trimmed = String(q ?? "").trim();
    if (trimmed.length < 4) return;
    if (searchParams.get("q") !== trimmed) {
      if (overviewEmbed) {
        const ok = await search(trimmed);
        goQuery(trimmed);
        if (ok) onTrackRecorded?.();
        return;
      }
      goQuery(trimmed);
      return;
    }
    const ok = await search(trimmed);
    if (ok) onTrackRecorded?.();
  }

  const inner = (
    <div className={`page-home${embedded ? " page-home--embedded" : ""}`}>
      <section className={compact ? "panel panel--dash-form track-embed-search" : "hero hero--elevated"}>
        {!compact && (
          <div className="hero__brand">
            <BrandMark size={32} />
            <p className="hero__eyebrow">{appName}</p>
          </div>
        )}
        {!compact && <h1 className="hero__headline">{t("track.homeTitle")}</h1>}
        {!compact && !user && !embedded && (
          <p className="hero__sub hero__sub--pitch">{t("track.homeSubtitle")}</p>
        )}
        <SearchBar
          key={searchParams.toString()}
          defaultValue={searchParams.get("q") ?? ""}
          onSubmit={handleSearchSubmit}
          loading={loading}
          placeholder={embedded ? t("track.placeholderDash") : t("track.placeholder")}
        />
        {!user && !embedded && (
          <SavedContainerTrackPicker
            disabled={loading}
            onPick={(cn) => {
              const picked = String(cn ?? "").trim();
              if (picked.length < 4) return;
              goQuery(picked);
            }}
          />
        )}
        {error && (
          <div className="alert alert--error" role="alert">
            {error}
          </div>
        )}
        {embedded && !loading && !data && !error && !normalizedQ && (
          <p className="track-embed-hint" role="status">
            {t("track.embedHint")}
          </p>
        )}
        {showPendingOperatorLoad && (
          <div className="track-embed-operator" role="region" aria-label={t("track.loadOperatorAria")}>
            <p className="track-embed-operator__lead">{t("track.loadOperatorLead", { cn: normalizedQ })}</p>
            <button
              type="button"
              className="btn btn--secondary track-embed-operator__btn"
              onClick={async () => {
                const ok = await search(qTrim);
                if (ok) onTrackRecorded?.();
              }}
            >
              {t("track.loadOperatorBtn")}
            </button>
          </div>
        )}
      </section>

      {loading && <LoadingSkeleton compact={overviewEmbed} />}

      {!loading && showTrackingResults && (
        <>
          <ShipmentHeader
            data={data}
            workspaceSavedRow={workspaceSavedRow}
            onWorkspaceLifecycleChange={onWorkspaceLifecycleChange}
          />

          <div className="dashboard-main">
            <div className="dashboard-main__col">
              <ContainerMetaCard data={data} />
              <VesselCard vessel={data.vessel} />
              {overviewEmbed ? (
                <CollapsiblePanel title={t("track.route")} defaultOpen>
                  <RouteMilestones milestones={data.routeMilestones} />
                </CollapsiblePanel>
              ) : (
                <div className="panel panel--route">
                  <h2 className="panel__title panel__title--section">{t("track.route")}</h2>
                  <RouteMilestones milestones={data.routeMilestones} />
                </div>
              )}
            </div>
            <div className="dashboard-main__map">
              <MapPanel data={data} />
            </div>
          </div>

          <LocationsBar locations={data.locations} />

          {overviewEmbed ? (
            <CollapsiblePanel title={t("track.timeline")} defaultOpen={false}>
              <Timeline events={data.timeline} />
            </CollapsiblePanel>
          ) : (
            <section className="panel panel--timeline">
              <div className="panel__head">
                <div>
                  <h2 className="panel__title panel__title--section">{t("track.timeline")}</h2>
                </div>
              </div>
              <Timeline events={data.timeline} />
            </section>
          )}
        </>
      )}

      {!showTrackingResults && !loading && !error && !user && !embedded && !authLoading && (
        <>
          <TrackGuestPromo />
          <HomeLandingSections />
        </>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div className={`track-workspace${compact ? " track-workspace--overview" : ""}`}>{inner}</div>
    );
  }

  return (
    <MainLayout dataSource={data?.source} title={t("track.mainTitle")}>
      {inner}
    </MainLayout>
  );
}
