import { Link } from "react-router-dom";
import { PageBreadcrumb } from "../../components/PageBreadcrumb.jsx";
import { useDashboardWorkspace } from "./DashboardWorkspaceContext.jsx";
import { useTranslation } from "../../i18n/LanguageContext.jsx";

export function DashboardAddContainer() {
  const { t } = useTranslation();
  const { clients, form, setForm, saving, handleAdd, overviewStats } = useDashboardWorkspace();

  return (
    <section className="panel panel--dash-form" aria-labelledby="add-container-heading">
      <PageBreadcrumb
        items={[
          { label: t("workspace.section.overview.topbar"), to: "/dashboard/overview" },
          { label: t("dashboardPage.addContainer.breadcrumbAdd") },
        ]}
      />
      <h2 id="add-container-heading" className="panel__title panel__title--section sr-only">
        {t("dashboardPage.addContainer.title")}
      </h2>
      <p className="panel__lead">
        <strong>{overviewStats.total}</strong> {t("dashboardPage.addContainer.savedWord")}
        {overviewStats.unassigned > 0 ? (
          <>
            {" "}
            · <strong>{overviewStats.unassigned}</strong> {t("dashboardPage.addContainer.unassignedWord")}
          </>
        ) : null}
        {" · "}
        <Link to="/dashboard/list" className="dash-overview__link">
          {t("dashboardPage.addContainer.viewList")}
        </Link>
      </p>
      <form className="dash-form" onSubmit={handleAdd}>
        <div className="field">
          <label className="field__label" htmlFor="dash-cn">
            {t("dashboardPage.addContainer.fieldLabel")} <span className="field__req">*</span>
          </label>
          <input
            id="dash-cn"
            className="field__input"
            placeholder={t("dashboardPage.addContainer.placeholder")}
            value={form.containerNumber}
            onChange={(e) => setForm((f) => ({ ...f, containerNumber: e.target.value }))}
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="dash-client-id">
            {t("dashboardPage.addContainer.clientOptional")}
          </label>
          <select
            id="dash-client-id"
            className="field__input"
            value={form.clientId}
            onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
          >
            <option value="">{t("dashboardPage.addContainer.unassignedOption")}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field field--grow">
          <label className="field__label" htmlFor="dash-notes">
            {t("dashboardPage.addContainer.notes")}
          </label>
          <input
            id="dash-notes"
            className="field__input"
            placeholder={t("dashboardPage.addContainer.notesPlaceholder")}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
        <div className="dash-form__actions">
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? t("dashboardPage.addContainer.saving") : t("dashboardPage.addContainer.save")}
          </button>
        </div>
      </form>
    </section>
  );
}
