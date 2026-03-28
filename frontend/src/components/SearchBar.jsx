import { useTranslation } from "../i18n/LanguageContext.jsx";

export function SearchBar({ onSubmit, loading, placeholder, defaultValue = "" }) {
  const { t } = useTranslation();

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = fd.get("q");
    onSubmit(q);
  }

  return (
    <div className="search-block">
      <form className="search-bar" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="container-q">
          {t("components.searchBar.label")}
        </label>
        <input
          id="container-q"
          name="q"
          type="text"
          autoComplete="off"
          defaultValue={defaultValue}
          placeholder={placeholder ?? t("track.placeholder")}
          className="search-bar__input"
          disabled={loading}
        />
        <button type="submit" className="btn btn--primary search-bar__btn" disabled={loading}>
          {loading ? t("components.searchBar.searching") : t("components.searchBar.track")}
        </button>
      </form>
      <p className="search-block__hint">{t("components.searchBar.hintMin")}</p>
    </div>
  );
}
