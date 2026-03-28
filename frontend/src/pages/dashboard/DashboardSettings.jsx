import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { PageBreadcrumb } from "../../components/PageBreadcrumb.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useTranslation } from "../../i18n/LanguageContext.jsx";

export function DashboardSettings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  async function copyCompanyInvite() {
    const code = user?.inviteCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      showToast({ message: t("dashboardPage.settings.copied"), variant: "success" });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="panel panel--dash-form" aria-labelledby="settings-heading">
      <PageBreadcrumb
        items={[
          { label: t("workspace.section.overview.topbar"), to: "/dashboard/overview" },
          { label: t("workspace.section.settings.topbar") },
        ]}
      />
      <h2 id="settings-heading" className="panel__title panel__title--section">
        {t("dashboardPage.settings.pageTitle")}
      </h2>

      <div className="settings-block">
        <h3 className="settings-block__title">{t("dashboardPage.settings.accountTitle")}</h3>
        <p className="settings-block__row">
          <span className="settings-block__label">{t("dashboardPage.settings.emailLabel")}</span>
          <span className="settings-block__value">{user?.email}</span>
        </p>
        <p className="settings-block__row">
          <span className="settings-block__label">{t("dashboardPage.settings.companyLabel")}</span>
          <span className="settings-block__value">{user?.companyName}</span>
        </p>
      </div>

      <div className="settings-block">
        <h3 className="settings-block__title">{t("dashboardPage.settings.inviteTitle")}</h3>
        <p className="panel__muted">
          {t("dashboardPage.settings.invitePart1")}
          <strong>{t("dashboardPage.settings.inviteRegisterWord")}</strong>
          {t("dashboardPage.settings.invitePart2")}
          <strong>{user?.companyName}</strong>. {t("dashboardPage.settings.invitePart3")}
        </p>
        {user?.inviteCode ? (
          <div className="settings-invite-row">
            <code className="dash__code settings-invite-code">{user.inviteCode}</code>
            <button type="button" className="btn btn--ghost btn--sm" onClick={copyCompanyInvite}>
              {copied ? t("dashboardPage.settings.copiedBtn") : t("dashboardPage.settings.copy")}
            </button>
            <Link to="/register" className="btn btn--ghost btn--sm">
              {t("dashboardPage.settings.openRegister")}
            </Link>
          </div>
        ) : (
          <p className="panel__muted">{t("dashboardPage.settings.noInvite")}</p>
        )}
      </div>

      <div className="settings-block">
        <h3 className="settings-block__title">{t("dashboardPage.settings.rolesTitle")}</h3>
        <ul className="settings-list">
          <li>
            <strong>Staff</strong> — {t("dashboardPage.settings.roleStaffDesc")}
          </li>
          <li>
            <strong>{t("workspace.clientLabel")}</strong> — {t("dashboardPage.settings.roleClientDesc")}
          </li>
        </ul>
      </div>
    </section>
  );
}
