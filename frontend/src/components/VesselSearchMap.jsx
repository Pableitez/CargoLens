import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { cartoTileUrl } from "../map/cartoTiles.js";
import { isValidLatLng } from "../utils/coords.js";

const MARKER_COLORS = ["#38bdf8", "#0ea5e9", "#22c55e", "#eab308", "#f97316", "#a855f7"];

function normalizeVesselPoint(v) {
  const lat = Number(v.latitude ?? v.lat);
  const lng = Number(v.longitude ?? v.lng ?? v.lon);
  if (!isValidLatLng(lat, lng)) return null;
  return { lat, lng, v };
}

function FitVesselBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 8);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 10 });
  }, [map, points]);
  return null;
}

// Centrar mapa en el buque seleccionado (deps numéricas para no re-volar en cada render).
function FlyToSelected({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat == null || lng == null) return;
    map.flyTo([lat, lng], Math.max(map.getZoom(), 8), { duration: 0.45 });
  }, [map, lat, lng]);
  return null;
}

// Marcador circular; pulsa al seleccionar (animación con setStyle de Leaflet).
function VesselCircleMarker({
  center,
  color,
  selected,
  children,
  markerKey,
}) {
  const ref = useRef(null);
  const baseRef = useRef({ color, weight: 2, fillOpacity: 0.85, radius: 9 });

  useEffect(() => {
    const layer = ref.current;
    if (!layer) return undefined;

    const applyBase = () => {
      layer.setStyle({
        color: baseRef.current.color,
        weight: baseRef.current.weight,
        fillColor: baseRef.current.color,
        fillOpacity: baseRef.current.fillOpacity,
      });
      layer.setRadius(baseRef.current.radius);
    };

    if (!selected) {
      applyBase();
      return undefined;
    }

    let raf;
    const start = performance.now();
    const tick = () => {
      const layerInner = ref.current;
      if (!layerInner) return;
      const t = (performance.now() - start) / 1000;
      const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2.5);
      layerInner.setStyle({
        color,
        fillColor: color,
        weight: 2 + pulse * 2.5,
        fillOpacity: 0.35 + pulse * 0.5,
      });
      layerInner.setRadius(9 + pulse * 5);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      applyBase();
    };
  }, [selected, color, markerKey]);

  return (
    <CircleMarker
      ref={ref}
      center={center}
      radius={9}
      pathOptions={{
        color,
        fillColor: color,
        fillOpacity: 0.85,
        weight: 2,
      }}
    >
      {children}
    </CircleMarker>
  );
}

export function VesselSearchMap({ vessels, selectedVesselIndex }) {
  const { theme } = useTheme();
  const tileUrl = cartoTileUrl(theme);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const points = useMemo(() => {
    const out = [];
    (vessels ?? []).forEach((v, originalIndex) => {
      const p = normalizeVesselPoint(v);
      if (p) out.push({ ...p, originalIndex });
    });
    return out;
  }, [vessels]);

  const boundsPoints = useMemo(() => {
    const pts = [];
    (vessels ?? []).forEach((v) => {
      const p = normalizeVesselPoint(v);
      if (p) pts.push([p.lat, p.lng]);
      for (const path of v.routePaths ?? []) {
        if (!Array.isArray(path)) continue;
        for (const pair of path) {
          if (!Array.isArray(pair) || pair.length < 2) continue;
          const lat = Number(pair[0]);
          const lng = Number(pair[1]);
          if (isValidLatLng(lat, lng)) pts.push([lat, lng]);
        }
      }
    });
    return pts;
  }, [vessels]);

  const center = useMemo(() => {
    if (points.length === 0) return null;
    return [points[0].lat, points[0].lng];
  }, [points]);

  const flyTo = useMemo(() => {
    if (selectedVesselIndex == null) return null;
    const hit = points.find((p) => p.originalIndex === selectedVesselIndex);
    if (!hit) return null;
    return { lat: hit.lat, lng: hit.lng };
  }, [points, selectedVesselIndex]);

  if (points.length === 0 || !center) {
    return null;
  }

  return (
    <div className="vessel-results-map">
      <h3 className="vessel-results-map__title">Map</h3>
      <p className="vessel-results-map__hint">
        {(vessels ?? []).some((v) => Array.isArray(v.containerNumbers) && v.containerNumbers.length > 0)
          ? "Positions from your saved containers’ tracking (Sinay)."
          : "Last known AIS positions for this result set."}
      </p>
      <div className="map-shell vessel-results-map__shell">
        {!ready && (
          <div className="map-shell__loading" aria-hidden>
            Loading map…
          </div>
        )}
        {ready && (
          <MapContainer
            center={center}
            zoom={points.length === 1 ? 8 : 4}
            className="map-shell__leaflet vessel-results-map__leaflet"
            scrollWheelZoom
          >
            <TileLayer
              key={theme}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
              url={tileUrl}
            />
            {boundsPoints.length > 0 && <FitVesselBounds points={boundsPoints} />}
            {flyTo && <FlyToSelected lat={flyTo.lat} lng={flyTo.lng} />}
            {(vessels ?? []).flatMap((v, vesselIdx) => {
              const paths = v.routePaths;
              if (!Array.isArray(paths) || paths.length === 0) return [];
              const color = MARKER_COLORS[vesselIdx % MARKER_COLORS.length];
              return paths.flatMap((path, pi) => {
                if (!Array.isArray(path) || path.length < 2) return [];
                const positions = path
                  .map((pair) => {
                    if (!Array.isArray(pair) || pair.length < 2) return null;
                    const lat = Number(pair[0]);
                    const lng = Number(pair[1]);
                    return isValidLatLng(lat, lng) ? [lat, lng] : null;
                  })
                  .filter(Boolean);
                if (positions.length < 2) return [];
                return [
                  <Polyline
                    key={`route-${vesselIdx}-${pi}`}
                    positions={positions}
                    pathOptions={{
                      color,
                      weight: 2.5,
                      opacity: 0.78,
                    }}
                  />,
                ];
              });
            })}
            {points.map((p) => {
              const v = p.v;
              const color = MARKER_COLORS[p.originalIndex % MARKER_COLORS.length];
              const selected = selectedVesselIndex === p.originalIndex;
              const speed = v.speed != null && v.speed !== "" ? `${Number(v.speed).toFixed(1)} kn` : null;
              const cnLine =
                Array.isArray(v.containerNumbers) && v.containerNumbers.length > 0
                  ? `Containers: ${v.containerNumbers.join(", ")}`
                  : null;
              const lines = [
                v.name || "Vessel",
                cnLine,
                v.imo ? `IMO ${v.imo}` : null,
                v.mmsi ? `MMSI ${v.mmsi}` : null,
                speed,
                `${p.lat.toFixed(4)}°, ${p.lng.toFixed(4)}°`,
              ].filter(Boolean);
              const markerKey = `${(v.containerNumbers ?? []).join("-")}-${v.imo}-${v.mmsi}-${p.originalIndex}`;
              return (
                <VesselCircleMarker
                  key={markerKey}
                  markerKey={markerKey}
                  center={[p.lat, p.lng]}
                  color={color}
                  selected={selected}
                >
                  <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent={false}>
                    <span className="vessel-results-map__tip">{lines.join("\n")}</span>
                  </Tooltip>
                </VesselCircleMarker>
              );
            })}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
