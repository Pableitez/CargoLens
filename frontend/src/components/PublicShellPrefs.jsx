import { ThemeToggle } from "./ThemeToggle.jsx";
import { useTranslation } from "../i18n/LanguageContext.jsx";

/** Language + theme controls for guests on public pages (no account modal). */
export function PublicShellPrefs() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className="public-shell-prefs no-print" aria-label={t("sidebar.prefsAria")}>
      <div className="public-shell-prefs__lang" role="group" aria-label={t("language.label")}>
        <button
          type="button"
          className={`public-shell-prefs__lang-btn${locale === "en" ? " public-shell-prefs__lang-btn--active" : ""}`}
          onClick={() => setLocale("en")}
          aria-pressed={locale === "en"}
        >
          EN
        </button>
        <button
          type="button"
          className={`public-shell-prefs__lang-btn${locale === "es" ? " public-shell-prefs__lang-btn--active" : ""}`}
          onClick={() => setLocale("es")}
          aria-pressed={locale === "es"}
        >
          ES
        </button>
      </div>
      <ThemeToggle className="public-shell-prefs__theme" />
    </div>
  );
}
