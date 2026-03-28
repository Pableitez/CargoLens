import { useTranslation } from "../i18n/LanguageContext.jsx";

export function DataSourceBadge({ source }) {
  const { t } = useTranslation();
  if (source === "safecube") {
    return (
      <span className="source-badge source-badge--live" title={t("components.dataSource.apiSafecubeTitle")}>
        {t("components.dataSource.apiSafecube")}
      </span>
    );
  }
  if (source === "mock") {
    return (
      <span className="source-badge source-badge--demo" title={t("components.dataSource.mockTitle")}>
        {t("components.dataSource.simulation")}
      </span>
    );
  }
  return null;
}
