import { MainLayout } from "../layouts/MainLayout.jsx";
import { BackLink } from "../components/BackLink.jsx";
import { appName } from "../config/siteMeta.js";
import { useTranslation } from "../i18n/LanguageContext.jsx";

export function PrivacyPolicyPage() {
  const { t } = useTranslation();

  return (
    <MainLayout title={t("pageTitle.privacy")} dataSource={null}>
      <div className="legal-page">
        <BackLink />
        <p className="legal-page__lead">
          {t("legal.privacyLead", { appName })}
        </p>
        <section className="legal-page__section">
          <h2 className="legal-page__h">{t("legal.dataTitle")}</h2>
          <p>{t("legal.dataBody")}</p>
        </section>
        <section className="legal-page__section">
          <h2 className="legal-page__h">{t("legal.retentionTitle")}</h2>
          <p>{t("legal.retentionBody")}</p>
        </section>
        <section className="legal-page__section">
          <h2 className="legal-page__h">{t("legal.contactTitle")}</h2>
          <p>{t("legal.contactBody")}</p>
        </section>
      </div>
    </MainLayout>
  );
}
