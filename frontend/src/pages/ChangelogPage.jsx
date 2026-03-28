import { MainLayout } from "../layouts/MainLayout.jsx";
import { BackLink } from "../components/BackLink.jsx";
import { useTranslation } from "../i18n/LanguageContext.jsx";

export function ChangelogPage() {
  const { t } = useTranslation();

  return (
    <MainLayout title={t("changelog.pageTitle")} dataSource={null}>
      <div className="legal-page changelog-page">
        <BackLink />
        <p className="legal-page__lead">{t("changelog.intro")}</p>
        <section className="legal-page__section">
          <h2 className="legal-page__h">{t("changelog.sectionProductTitle")}</h2>
          <ul className="changelog-page__list">
            <li>{t("changelog.itemPalette")}</li>
            <li>{t("changelog.itemNotifications")}</li>
            <li>{t("changelog.itemKpi")}</li>
            <li>{t("changelog.itemConnectivity")}</li>
            <li>{t("changelog.itemTimezone")}</li>
            <li>{t("changelog.itemPrint")}</li>
            <li>{t("changelog.itemPwa")}</li>
          </ul>
        </section>
        <section className="legal-page__section">
          <h2 className="legal-page__h">{t("changelog.sectionDevTitle")}</h2>
          <ul className="changelog-page__list">
            <li>{t("changelog.itemE2e")}</li>
            <li>{t("changelog.itemOnboarding")}</li>
            <li>{t("changelog.itemLegal")}</li>
          </ul>
        </section>
      </div>
    </MainLayout>
  );
}
