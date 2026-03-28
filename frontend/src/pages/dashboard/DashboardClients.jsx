import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { PageBreadcrumb } from "../../components/PageBreadcrumb.jsx";
import { useDashboardWorkspace } from "./DashboardWorkspaceContext.jsx";
import { formatShortDate } from "./dashboardUtils.js";
import { useTranslation } from "../../i18n/LanguageContext.jsx";

export function DashboardClients() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    clients,
    clientForm,
    setClientForm,
    savingClient,
    handleAddClient,
    handleDeleteClient,
    handleUpdateClient,
  } = useDashboardWorkspace();

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  return (
    <section className="panel panel--dash-form" aria-labelledby="clients-heading">
      <PageBreadcrumb
        items={[
          { label: t("workspace.section.overview.topbar"), to: "/dashboard/overview" },
          { label: t("workspace.section.clients.topbar") },
        ]}
      />
      <h2 id="clients-heading" className="panel__title panel__title--section sr-only">
        {t("dashboardPage.clients.srTitle")}
      </h2>
      {user?.inviteCode && (
        <div className="panel__callout" role="note">
          <span className="panel__callout-label">{t("dashboardPage.clients.staffInvite")}</span>{" "}
          <code className="dash__code">{user.inviteCode}</code>
        </div>
      )}
      <p className="panel__lead">
        {t("dashboardPage.clients.leadBefore")}
        <kbd className="kbd">C…</kbd>
        {t("dashboardPage.clients.leadAfter")}
      </p>
      <form className="dash-form dash-form--inline" onSubmit={handleAddClient}>
        <div className="field field--grow">
          <label className="field__label" htmlFor="new-client-name">
            {t("dashboardPage.clients.clientNameLabel")}
          </label>
          <input
            id="new-client-name"
            className="field__input"
            value={clientForm.name}
            onChange={(e) => setClientForm({ name: e.target.value })}
            placeholder={t("dashboardPage.clients.clientNamePlaceholder")}
          />
        </div>
        <div className="dash-form__actions">
          <button type="submit" className="btn btn--primary" disabled={savingClient}>
            {savingClient ? t("dashboardPage.clients.adding") : t("dashboardPage.clients.addClient")}
          </button>
        </div>
      </form>
      {clients.length === 0 && (
        <div className="empty-state empty-state--compact empty-state--panel">
          <p className="empty-state__title">{t("dashboardPage.clients.emptyTitle")}</p>
          <p className="empty-state__body">{t("dashboardPage.clients.empty")}</p>
          <p className="empty-state__body empty-state__hint">{t("dashboardPage.clients.emptyCta")}</p>
        </div>
      )}
      {clients.length > 0 && (
        <div className="dash-table-wrap dash-table-wrap--mt">
          <table className="dash-table">
            <thead>
              <tr>
                <th scope="col">{t("dashboardPage.clients.thClient")}</th>
                <th scope="col">{t("dashboardPage.clients.thContainers")}</th>
                <th scope="col">{t("dashboardPage.clients.thInvite")}</th>
                <th scope="col">{t("dashboardPage.clients.thCreated")}</th>
                <th scope="col">
                  <span className="sr-only">{t("dashboardPage.clients.thActions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td>
                    {editingId === c.id ? (
                      <input
                        className="field__input dash-table__edit-name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        aria-label={t("dashboardPage.clients.ariaClientName")}
                      />
                    ) : (
                      c.name
                    )}
                  </td>
                  <td>
                    <span className="dash-table__num">{c.savedContainerCount ?? 0}</span>
                  </td>
                  <td>
                    <code className="dash__code">{c.inviteCode}</code>
                  </td>
                  <td className="dash-table__date">{formatShortDate(c.createdAt)}</td>
                  <td>
                    {editingId === c.id ? (
                      <div className="dash-table__row-actions">
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          disabled={!editName.trim()}
                          onClick={async () => {
                            if (!editName.trim()) return;
                            try {
                              await handleUpdateClient(c.id, editName);
                              setEditingId(null);
                            } catch {
                              /* error shown in layout */
                            }
                          }}
                        >
                          {t("dashboardPage.clients.save")}
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => setEditingId(null)}
                        >
                          {t("dashboardPage.clients.cancel")}
                        </button>
                      </div>
                    ) : (
                      <div className="dash-table__row-actions">
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => {
                            setEditingId(c.id);
                            setEditName(c.name);
                          }}
                        >
                          {t("dashboardPage.clients.edit")}
                        </button>
                        <button type="button" className="btn btn--danger btn--sm" onClick={() => handleDeleteClient(c.id)}>
                          {t("dashboardPage.clients.remove")}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
