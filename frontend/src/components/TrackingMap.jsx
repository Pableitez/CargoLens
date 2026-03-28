import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { cartoTileUrl } from "../map/cartoTiles.js";
import { isValidLatLng } from "../utils/coords.js";

const ROUTE_COLOR = "#38bdf8";

function collectBoundsPoints(position, routePaths) {
  const pts = [];
  if (isValidLatLng(position?.lat, position?.lng)) {
    pts.push([Number(position.lat), Number(position.lng)]);
  }
  for (const path of routePaths ?? []) {
    for (const pair of path) {
      if (pair?.length >= 2 && isValidLatLng(pair[0], pair[1])) {
        pts.push([Number(pair[0]), Number(pair[1])]);
      }
    }
  }
  return pts;
}

function FitTrackingBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 5);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 8 });
  }, [map, points]);
  return null;
}

export function TrackingMap({ position, vesselName, routePaths }) {
  const { theme } = useTheme();
  const tileUrl = cartoTileUrl(theme);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const center = useMemo(() => {
    if (isValidLatLng(position?.lat, position?.lng)) {
      return [Number(position.lat), Number(position.lng)];
    }
    const p0 = routePaths?.[0]?.[0];
    if (p0?.length >= 2 && isValidLatLng(p0[0], p0[1])) {
      return [Number(p0[0]), Number(p0[1])];
    }
    return null;
  }, [position, routePaths]);

  const markerPos = useMemo(() => {
    if (isValidLatLng(position?.lat, position?.lng)) {
      return [Number(position.lat), Number(position.lng)];
    }
    const path = routePaths?.[0];
    if (path?.length) {
      for (let j = path.length - 1; j >= 0; j -= 1) {
        const last = path[j];
        if (last?.length >= 2 && isValidLatLng(last[0], last[1])) {
          return [Number(last[0]), Number(last[1])];
        }
      }
    }
    return center;
  }, [position, routePaths, center]);

  const boundsPoints = useMemo(() => collectBoundsPoints(position, routePaths), [position, routePaths]);

  const hasRoutes = Array.isArray(routePaths) && routePaths.some((p) => p?.length >= 2);

  if (!center || !markerPos) {
    return <div className="map-shell map-shell--empty">No position</div>;
  }

  return (
    <div className="map-shell">
      {!ready && (
        <div className="map-shell__loading" aria-hidden>
          Loading map…
        </div>
      )}
      {ready && (
        <MapContainer center={center} zoom={4} className="map-shell__leaflet" scrollWheelZoom>
          <TileLayer
            key={theme}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url={tileUrl}
          />
          {boundsPoints.length > 0 && <FitTrackingBounds points={boundsPoints} />}
          {hasRoutes &&
            routePaths.map((path, pi) =>
              path.length >= 2 ? (
                <Polyline
                  key={`route-${pi}`}
                  positions={path.map(([lat, lng]) => [lat, lng])}
                  pathOptions={{
                    color: ROUTE_COLOR,
                    weight: 2,
                    opacity: 0.8,
                  }}
                />
              ) : null
            )}
          <CircleMarker
            center={markerPos}
            radius={10}
            pathOptions={{
              color: ROUTE_COLOR,
              fillColor: ROUTE_COLOR,
              fillOpacity: 0.85,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent={false}>
              {vesselName ?? "Vessel"}
            </Tooltip>
          </CircleMarker>
        </MapContainer>
      )}
    </div>
  );
}
