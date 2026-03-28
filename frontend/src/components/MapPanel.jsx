import { useMemo } from "react";
import { TrackingMap } from "./TrackingMap.jsx";
import { useTranslation } from "../i18n/LanguageContext.jsx";

export function MapPanel({ data }) {
  const { t, dateLocale } = useTranslation();
  const hasRoute = Array.isArray(data.routePaths) && data.routePaths.some((p) => p?.length >= 2);

  const src = useMemo(() => {
    if (hasRoute) {
      if (data.positionSource === "ais") return t("components.mapPanel.captionHasRouteAis");
      if (data.source === "safecube") return t("components.mapPanel.captionHasRouteOperator");
      return t("components.mapPanel.captionHasRouteDemo");
    }
    if (data.positionSource === "ais") return t("components.mapPanel.captionNoRouteAis");
    if (data.source === "safecube") return t("components.mapPanel.captionNoRouteOperator");
    return t("components.mapPanel.captionNoRouteDemo");
  }, [data.positionSource, data.source, hasRoute, t]);

  return (
    <div className="map-panel">
      <div className="panel__head panel__head--map">
        <div>
          <h2 className="panel__title">{t("components.mapPanel.title")}</h2>
          <p className="panel__hint">{src}</p>
        </div>
        {data.coordinatesLabel && (
          <div className="coord-pill" title={t("components.mapPanel.latLongTitle")}>
            {data.coordinatesLabel}
          </div>
        )}
      </div>
      <div className="map-panel__frame">
        <TrackingMap position={data.position} vesselName={data.vessel?.name} routePaths={data.routePaths} />
      </div>
      {data.ais?.updatedAt && (
        <p className="map-panel__foot">
          {t("components.mapPanel.aisUpdate")}{" "}
          {new Date(data.ais.updatedAt).toLocaleString(dateLocale === "es-ES" ? "es-ES" : "en-GB")}
        </p>
      )}
    </div>
  );
}
