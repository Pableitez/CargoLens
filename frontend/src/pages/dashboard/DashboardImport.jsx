import { PageBreadcrumb } from "../../components/PageBreadcrumb.jsx";
import { downloadCsvTemplate } from "./dashboardUtils.js";
import { useDashboardWorkspace } from "./DashboardWorkspaceContext.jsx";
import { useTranslation } from "../../i18n/LanguageContext.jsx";

export function DashboardImport() {
  const { t } = useTranslation();
  const { importMsg, importing, handleImportFile } = useDashboardWorkspace();

  return (
    <section className="panel panel--dash-form" aria-labelledby="import-heading">
      <PageBreadcrumb
        items={[
          { label: t("workspace.section.overview.topbar"), to: "/dashboard/overview" },
          { label: t("workspace.section.import.topbar") },
        ]}
      />
      <h2 id="import-heading" className="panel__title panel__title--section sr-only">
        {t("dashboardPage.import.title")}
      </h2>
      <p className="panel__lead">
        {t("dashboardPage.import.leadBefore")}
        <strong>.xlsx</strong>
        {t("dashboardPage.import.leadAfter")}
      </p>
      <div className="import-spec" role="table" aria-label={t("dashboardPage.import.ariaColumns")}>
        <div className="import-spec__row import-spec__row--head">
          <span>{t("dashboardPage.import.colColumn")}</span>
          <span>{t("dashboardPage.import.colRequired")}</span>
          <span>{t("dashboardPage.import.colDesc")}</span>
        </div>
        <div className="import-spec__row">
          <code className="kbd">container</code>
          <span>{t("dashboardPage.import.colYes")}</span>
          <span>{t("dashboardPage.import.colIso")}</span>
        </div>
        <div className="import-spec__row">
          <code className="kbd">client_invite</code>
          <span>{t("dashboardPage.import.colNo")}</span>
          <span>{t("dashboardPage.import.colClient")}</span>
        </div>
        <div className="import-spec__row">
          <code className="kbd">notes</code>
          <span>{t("dashboardPage.import.colNo")}</span>
          <span>{t("dashboardPage.import.colNote")}</span>
        </div>
      </div>
      <div className="import-row">
        <label className={`btn btn--ghost import-file-label${importing ? " import-file-label--busy" : ""}`}>
          {importing ? t("dashboard.importing") : t("dashboardPage.import.chooseFile")}
          <input type="file" accept=".xlsx,.xls" className="sr-only" onChange={handleImportFile} disabled={importing} />
        </label>
        <button type="button" className="btn btn--ghost" onClick={downloadCsvTemplate}>
          {t("dashboardPage.import.csvTemplate")}
        </button>
      </div>
      {importing && (
        <p className="import-msg import-msg--progress" role="status" aria-live="polite">
          {t("dashboard.importing")}
        </p>
      )}
      {importMsg && !importing && <p className="import-msg">{importMsg}</p>}
    </section>
  );
}
