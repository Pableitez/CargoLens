import { useTheme } from "../contexts/ThemeContext.jsx";
import { useTranslation } from "../i18n/LanguageContext.jsx";

function IconSun() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Luna estilo Feather; legible a 18px.
function IconMoon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

// Oscuro (por defecto) / claro; preferencia en localStorage.
export function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      className={`theme-toggle${className ? ` ${className}` : ""}`}
      onClick={toggleTheme}
      aria-label={isLight ? t("components.themeToggle.ariaDark") : t("components.themeToggle.ariaLight")}
      title={isLight ? t("components.themeToggle.titleDark") : t("components.themeToggle.titleLight")}
    >
      <span className="theme-toggle__icon">{isLight ? <IconMoon /> : <IconSun />}</span>
    </button>
  );
}
