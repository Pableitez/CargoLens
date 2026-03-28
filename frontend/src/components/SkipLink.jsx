import { useTranslation } from "../i18n/LanguageContext.jsx";

export function SkipLink() {
  const { t } = useTranslation();
  return (
    <a href="#main-content" className="skip-link">
      {t("skipLink.label")}
    </a>
  );
}
