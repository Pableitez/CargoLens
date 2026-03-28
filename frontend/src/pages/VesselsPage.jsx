import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BackLink } from "../components/BackLink.jsx";
import { MainLayout } from "../layouts/MainLayout.jsx";
import { VesselSearchMap } from "../components/VesselSearchMap.jsx";
import { VesselsGuestPromo } from "../components/VesselsGuestPromo.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import * as vesselsApi from "../api/vessels.js";
import { isValidLatLng } from "../utils/coords.js";
import { useTranslation } from "../i18n/LanguageContext.jsx";
import {
  vesselNoCoordsFootnote,
  vesselResultsMapDataSource,
  vesselResultsSourceLabel,
} from "./vesselsPageHelpers.js";

const VESSELS_PAGE_SIZE = 10;

function VesselSavedListCell({ breakdown, t }) {
  if (!breakdown) return "—";
  const a = breakdown.active ?? 0;
  const c = breakdown.completed ?? 0;
  if (a === 0 && c === 0) return "—";

  const wrap = (children) => <div className="vessel-saved-list-cell">{children}</div>;

  if (a > 0 && c === 0) {
    return wrap(
      <span className="vessel-saved-list-badge vessel-saved-list-badge--active">{t("vesselsPage.savedStatusActive")}</span>
    );
  }
  if (c > 0 && a === 0) {
    return wrap(
      <span className="vessel-saved-list-badge vessel-saved-list-badge--completed">{t("vesselsPage.savedStatusCompleted")}</span>
    );
  }
  return wrap(
    <>
      <span className="vessel-saved-list-badge vessel-saved-list-badge--active">{t("vesselsPage.savedLineActive", { count: a })}</span>
      <span className="vessel-saved-list-badge vessel-saved-list-badge--completed">{t("vesselsPage.savedLineCompleted", { count: c })}</span>
    </>
  );
}

function VesselResultTableRow({
  v,
  globalIndex,
  selectedVesselIndex,
  setSelectedVesselIndex,
  showContainersCol,
  showStatusCol,
  showLifecycleCol,
  vesselExtraCols,
  t,
}) {
  const canMap = isValidLatLng(v.latitude ?? v.lat, v.longitude ?? v.lng ?? v.lon);
  const selected = selectedVesselIndex === globalIndex;
  const toggle = () =>
    setSelectedVesselIndex((prev) => (prev === globalIndex ? null : globalIndex));

  return (
    <tr
      className={
        selected
          ? "dash-table__row dash-table__row--selectable dash-table__row--selected"
          : "dash-table__row dash-table__row--selectable"
      }
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      }}
      tabIndex={0}
      aria-selected={selected}
      aria-label={canMap ? `${v.name || "Vessel"} — show on map` : `${v.name || "Vessel"} — no map position`}
    >
      <td>{v.name}</td>
      {showContainersCol ? (
        <td className="dash-table__mono dash-table__wrap">
          {v.containerNumbers?.length ? v.containerNumbers.join(", ") : "—"}
        </td>
      ) : null}
      {showStatusCol ? (
        <td className="dash-table__date">
          {v.trackingError ? "No tracking" : v.shipmentStatus ?? "—"}
        </td>
      ) : null}
      {showLifecycleCol ? (
        <td className="vessel-saved-list-td">
          <VesselSavedListCell breakdown={v.lifecycleBreakdown} t={t} />
        </td>
      ) : null}
      <td className="dash-table__mono">{v.imo || "—"}</td>
      <td className="dash-table__mono">{v.mmsi || "—"}</td>
      <td>{v.flag || "—"}</td>
      {vesselExtraCols.type ? <td>{v.vesselType || "—"}</td> : null}
      {vesselExtraCols.speed ? (
        <td className="dash-table__mono">
          {v.speed != null && v.speed !== "" ? `${Number(v.speed).toFixed(1)} kn` : "—"}
        </td>
      ) : null}
      {vesselExtraCols.lastUpdate ? (
        <td className="dash-table__date">
          {v.lastUpdate != null && v.lastUpdate !== "" ? String(v.lastUpdate) : "—"}
        </td>
      ) : null}
    </tr>
  );
}

export function VesselsPage() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [selectedVesselIndex, setSelectedVesselIndex] = useState(null);
  const [resultsPage, setResultsPage] = useState(0);

  useEffect(() => {
    setSelectedVesselIndex(null);
    setResultsPage(0);
  }, [data]);

  const vessels = useMemo(() => data?.vessels ?? [], [data]);
  const vesselPageTotal = vessels.length;
  const vesselPageCount = Math.max(1, Math.ceil(vesselPageTotal / VESSELS_PAGE_SIZE));
  const safePage = Math.min(resultsPage, Math.max(0, vesselPageCount - 1));
  const pageStart = safePage * VESSELS_PAGE_SIZE;
  const pagedVessels = useMemo(
    () => vessels.slice(pageStart, pageStart + VESSELS_PAGE_SIZE),
    [vessels, pageStart]
  );

  useEffect(() => {
    if (resultsPage !== safePage) setResultsPage(safePage);
  }, [resultsPage, safePage]);

  async function handleSearch(e) {
    e.preventDefault();
    const t = q.trim();
    if (t.length < 3) {
      setError("Use at least 3 characters—name fragment, MMSI, or IMO.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await vesselsApi.searchVessels(t);
      setData(res);
    } catch (err) {
      setData(null);
      const d = err.response?.data;
      const msg = d?.message ?? err.message ?? "Search failed.";
      const hint = d?.hint ? ` ${d.hint}` : "";
      setError(`${msg}${hint}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadFromSavedContainers() {
    if (!user) {
      setError("Sign in to load vessels tied to your saved containers.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await vesselsApi.getVesselsFromSavedContainers();
      setData(res);
    } catch (err) {
      setData(null);
      const d = err.response?.data;
      const msg = d?.message ?? err.message ?? "Could not load vessels from containers.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const sourceLabel = vesselResultsSourceLabel(data);

  const mapDataSource = vesselResultsMapDataSource(data);

  const hasRows = data?.vessels?.length > 0;
  const showEmpty = data && !hasRows && !error;

  const anyVesselCoords = useMemo(() => {
    if (!data?.vessels?.length) return false;
    return data.vessels.some((v) =>
      isValidLatLng(v.latitude ?? v.lat, v.longitude ?? v.lng ?? v.lon)
    );
  }, [data]);

  const showContainersCol = Boolean(data?.vessels?.some((v) => Array.isArray(v.containerNumbers) && v.containerNumbers.length > 0));
  const showStatusCol = data?.source === "containers";
  const showLifecycleCol = data?.source === "containers";

  // Sin columnas de tipo / velocidad / última actualización si la API no envía datos (evita solo “—”).
  const vesselExtraCols = useMemo(() => {
    const vs = data?.vessels;
    if (!vs?.length) return { type: false, speed: false, lastUpdate: false };
    const hasType = vs.some((v) => v.vesselType != null && String(v.vesselType).trim() !== "");
    const hasSpeed = vs.some((v) => v.speed != null && v.speed !== "");
    const hasLast = vs.some((v) => v.lastUpdate != null && String(v.lastUpdate).trim() !== "");
    return { type: hasType, speed: hasSpeed, lastUpdate: hasLast };
  }, [data?.vessels]);

  const showGuestPromo = !user && !authLoading && !data && !loading && !error;

  return (
    <MainLayout dataSource={mapDataSource} title="Vessels">
      <div className="page-vessels">
        <BackLink className="page-vessels__back" />
        <section className="hero hero--elevated">
          <p className="hero__eyebrow">Vessels</p>
          <h1 className="hero__headline">Search</h1>
          <p className="hero__sub hero__sub--tight">
            <span className="hero__sub-line">Public search uses Ports &amp; Vessels.</span>
            <span className="hero__sub-line">
              <strong>From saved containers</strong> uses the same tracking as your dashboard map.
            </span>
          </p>
          <form className="search-bar" onSubmit={handleSearch}>
            <label className="sr-only" htmlFor="vessel-q">
              Search vessels
            </label>
            <input
              id="vessel-q"
              className="search-bar__input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, MMSI, or IMO (3+ characters)"
              disabled={loading}
            />
            <button type="submit" className="btn btn--primary search-bar__btn" disabled={loading}>
              {loading ? "…" : "Search"}
            </button>
          </form>
          <div className="vessel-page__secondary-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={loadFromSavedContainers}
              disabled={loading}
            >
              {loading ? "Loading…" : "From saved containers"}
            </button>
            {!user ? (
              <span className="search-block__hint">
                <Link to="/login">Sign in</Link> to use this.
              </span>
            ) : null}
          </div>
          {error && (
            <div className="alert alert--error" role="alert">
              {error}
            </div>
          )}
          {sourceLabel && !error && <p className="search-block__hint vessel-page__source-hint">{sourceLabel}</p>}
        </section>

        {showGuestPromo && <VesselsGuestPromo />}

        {hasRows && (
          <div className="panel vessel-results">
            <h2 className="panel__title panel__title--section">Results</h2>
            {showLifecycleCol ? (
              <p className="vessel-results__legend" role="note">
                {t("vesselsPage.savedListLegend")}
              </p>
            ) : null}
            {anyVesselCoords ? (
              <p className="vessel-results__select-hint">Click a row to pulse that vessel on the map.</p>
            ) : null}
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    {showContainersCol ? <th scope="col">Containers</th> : null}
                    {showStatusCol ? <th scope="col">Shipment</th> : null}
                    {showLifecycleCol ? (
                      <th scope="col" title={t("vesselsPage.thSavedListHint")} className="dash-table__th-hint">
                        {t("vesselsPage.thSavedList")}
                      </th>
                    ) : null}
                    <th scope="col">IMO</th>
                    <th scope="col">MMSI</th>
                    <th scope="col">Flag</th>
                    {vesselExtraCols.type ? <th scope="col">Type</th> : null}
                    {vesselExtraCols.speed ? <th scope="col">Speed</th> : null}
                    {vesselExtraCols.lastUpdate ? <th scope="col">Last update</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {pagedVessels.map((v, i) => (
                    <VesselResultTableRow
                      key={`${(v.containerNumbers ?? []).join("-")}-${v.imo}-${v.mmsi}-${pageStart + i}`}
                      v={v}
                      globalIndex={pageStart + i}
                      selectedVesselIndex={selectedVesselIndex}
                      setSelectedVesselIndex={setSelectedVesselIndex}
                      showContainersCol={showContainersCol}
                      showStatusCol={showStatusCol}
                      showLifecycleCol={showLifecycleCol}
                      vesselExtraCols={vesselExtraCols}
                      t={t}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            {vesselPageTotal > VESSELS_PAGE_SIZE ? (
              <nav className="vessel-results__pagination" aria-label={t("vesselsPage.paginationAria")}>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={safePage <= 0}
                  onClick={() => setResultsPage((p) => Math.max(0, p - 1))}
                >
                  {t("vesselsPage.paginationPrev")}
                </button>
                <span className="vessel-results__pagination-summary">
                  {t("vesselsPage.paginationSummary", {
                    start: vesselPageTotal === 0 ? 0 : pageStart + 1,
                    end: Math.min(pageStart + VESSELS_PAGE_SIZE, vesselPageTotal),
                    total: vesselPageTotal,
                  })}
                </span>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={pageStart + VESSELS_PAGE_SIZE >= vesselPageTotal}
                  onClick={() => setResultsPage((p) => Math.min(vesselPageCount - 1, p + 1))}
                >
                  {t("vesselsPage.paginationNext")}
                </button>
              </nav>
            ) : null}
            <VesselSearchMap vessels={data.vessels} selectedVesselIndex={selectedVesselIndex} />
            {!anyVesselCoords && <p className="vessel-results-map__no-ais">{vesselNoCoordsFootnote(data)}</p>}
          </div>
        )}

        {showEmpty && (
          <div className="empty-state empty-state--compact">
            <p className="empty-state__title">No vessels returned</p>
            <p className="empty-state__body">
              {data?.hint ??
                (data?.source === "containers"
                  ? "Save containers in the workspace, then try again."
                  : "Try a different name fragment, MMSI, or IMO. Confirm your Sinay API key includes Ports & Vessels access.")}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
