import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useTranslation } from "../i18n/LanguageContext.jsx";
import { cartoTileUrl } from "../map/cartoTiles.js";
import { colorForContainer } from "../utils/overviewColors.js";
import { DASHBOARD_OVERVIEW_PATH } from "../config/paths.js";

function markerLatLng(item) {
  if (item.position?.lat != null && item.position?.lng != null) {
    return [item.position.lat, item.position.lng];
  }
  const p0 = item.routePaths?.[0]?.[0];
  if (p0?.length >= 2) return [p0[0], p0[1]];
  return null;
}

function collectBoundsPoints(items) {
  const pts = [];
  for (let i = 0; i < items.length; i += 1) {
    const it = items[i];
    if (!it.ok) continue;
    const m = markerLatLng(it);
    if (m) pts.push(m);
    for (const path of it.routePaths ?? []) {
      for (const pair of path) {
        if (pair?.length >= 2) pts.push([pair[0], pair[1]]);
      }
    }
  }
  return pts;
}

function FitWorkspace({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) {
      map.setView([18, -35], 2);
      return;
    }
    if (points.length === 1) {
      map.setView(points[0], 5);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 7 });
  }, [map, points]);
  return null;
}

function OverviewFleetMap({ payload }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const tileUrl = cartoTileUrl(theme);

  const goTrack = useCallback(
    (containerNumber) => {
      navigate(`${DASHBOARD_OVERVIEW_PATH}?q=${encodeURIComponent(containerNumber)}`);
    },
    [navigate]
  );

  useEffect(() => {
    setReady(true);
  }, []);

  const items = useMemo(() => payload?.items ?? [], [payload?.items]);
  const boundsPoints = useMemo(() => collectBoundsPoints(items), [items]);

  const center = useMemo(() => {
    if (boundsPoints.length > 0) return boundsPoints[0];
    return [20, -30];
  }, [boundsPoints]);

  if (!payload || payload.mode === "empty") {
    return (
      <div className="overview-map overview-map--empty">
        <p className="overview-map__empty-text">{t("overviewMap.empty")}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="overview-map overview-map--empty">
        <p className="overview-map__empty-text">{t("overviewMap.apiOnlyEmpty")}</p>
      </div>
    );
  }

  return (
    <div className="overview-map">
      {(payload.mode === "mock" || payload.mode === "manual") && payload.hint && (
        <p className="overview-map__hint">{payload.hint}</p>
      )}
      <div className="overview-map__frame">
        {!ready ? (
          <div className="map-shell__loading" aria-hidden>
            {t("overviewMap.loadingMap")}
          </div>
        ) : (
          <MapContainer center={center} zoom={3} className="map-shell__leaflet overview-map__leaflet" scrollWheelZoom>
            <TileLayer
              key={theme}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
              url={tileUrl}
            />
            {boundsPoints.length > 0 && <FitWorkspace points={boundsPoints} />}
            {items.map((it) => {
              if (!it.ok) return null;
              const col = colorForContainer(it.containerNumber);
              const onGo = () => goTrack(it.containerNumber);
              return (
                <Fragment key={`${it.containerNumber}-lines`}>
                  {(it.routePaths ?? []).map((path, pi) =>
                    path.length >= 2 ? (
                      <Polyline
                        key={`${it.containerNumber}-p-${pi}`}
                        positions={path.map(([lat, lng]) => [lat, lng])}
                        pathOptions={{
                          color: col,
                          weight: 2,
                          opacity: 0.75,
                        }}
                        eventHandlers={{ click: onGo }}
                      />
                    ) : null
                  )}
                </Fragment>
              );
            })}
            {items.map((it) => {
              if (!it.ok) return null;
              const ll = markerLatLng(it);
              if (!ll) return null;
              const col = colorForContainer(it.containerNumber);
              return (
                <CircleMarker
                  key={`${it.containerNumber}-m`}
                  center={ll}
                  radius={9}
                  pathOptions={{
                    color: col,
                    fillColor: col,
                    fillOpacity: 0.9,
                    weight: 2,
                  }}
                  eventHandlers={{ click: () => goTrack(it.containerNumber) }}
                >
                  <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                    <strong>{it.containerNumber}</strong>
                    {it.vesselName ? <div>{it.vesselName}</div> : null}
                    <div>{it.statusLabel ?? it.status ?? "—"}</div>
                    <div className="overview-map__tt-hint">{t("overviewMap.clickTooltip")}</div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}
      </div>
      {items.some((it) => !it.ok) && (
        <p className="overview-map__partial">{t("overviewMap.partialHint")}</p>
      )}
    </div>
  );
}

export { OverviewFleetMap };
