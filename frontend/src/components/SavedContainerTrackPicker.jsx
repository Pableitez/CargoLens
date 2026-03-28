import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useTranslation } from "../i18n/LanguageContext.jsx";
import * as containersApi from "../api/containers.js";

const MAX_RESULTS = 150;

function matchesQuery(it, q) {
  const n = (it.containerNumber ?? "").toLowerCase();
  const c = (it.clientName ?? "").toLowerCase();
  const notes = (it.notes ?? "").toLowerCase();
  return n.includes(q) || c.includes(q) || notes.includes(q);
}

// Sesión iniciada: buscar contenedores guardados por texto (sin select gigante).
export function SavedContainerTrackPicker({ onPick, disabled }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const p = "components.savedPicker";

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await containersApi.fetchContainers();
        if (!cancelled) setItems(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const trimmed = filter.trim();
  const qLower = trimmed.toLowerCase();

  const totalMatchCount = useMemo(() => {
    if (!qLower) return 0;
    return items.reduce((n, it) => (matchesQuery(it, qLower) ? n + 1 : n), 0);
  }, [items, qLower]);

  const filtered = useMemo(() => {
    if (!qLower) return [];
    return items.filter((it) => matchesQuery(it, qLower)).slice(0, MAX_RESULTS);
  }, [items, qLower]);

  const showNoMatches = !loading && items.length > 0 && trimmed.length > 0 && filtered.length === 0;
  const showList = !loading && trimmed.length > 0 && filtered.length > 0;
  const showCapHint = showList && totalMatchCount > MAX_RESULTS;

  function handlePick(cn) {
    setFilter("");
    onPick(cn);
  }

  const placeholder = useMemo(() => {
    if (loading) return t(`${p}.placeholderLoading`);
    if (items.length) return t(`${p}.placeholderSearch`, { count: items.length });
    return t(`${p}.placeholderEmpty`);
  }, [loading, items.length, t]);

  if (!user) return null;

  return (
    <div className="search-block-saved">
      <label htmlFor="saved-container-search" className="search-block-saved__label">
        {t(`${p}.label`)}
      </label>
      <div className="search-block-saved__combo">
        <input
          id="saved-container-search"
          type="search"
          className="search-block-saved__input field__input"
          placeholder={placeholder}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          disabled={disabled || loading}
          autoComplete="off"
          spellCheck={false}
        />
        {trimmed.length > 0 ? (
          <button
            type="button"
            className="search-block-saved__clear"
            onClick={() => setFilter("")}
            disabled={disabled || loading}
            aria-label={t(`${p}.clearAria`)}
          >
            {t(`${p}.clearButton`)}
          </button>
        ) : null}
      </div>

      {loading ? (
        <span className="search-block-saved__muted" aria-live="polite">
          {t(`${p}.loading`)}
        </span>
      ) : null}

      {!loading && items.length === 0 ? (
        <span className="search-block-saved__muted">
          {t(`${p}.emptyHintBefore`)}{" "}
          <Link to="/dashboard/list" className="search-block-saved__link">
            {t(`${p}.workspaceList`)}
          </Link>
          {t(`${p}.emptyHintAfter`)}
        </span>
      ) : null}

      {!loading && items.length > 0 && trimmed.length === 0 ? (
        <p className="search-block-saved__hint">{t(`${p}.typeHint`)}</p>
      ) : null}

      {showNoMatches ? (
        <p className="search-block-saved__empty" role="status">
          {t(`${p}.noMatch`, { query: trimmed })}
        </p>
      ) : null}

      {showCapHint ? (
        <p className="search-block-saved__cap">{t(`${p}.capHint`, { max: MAX_RESULTS })}</p>
      ) : null}

      {showList ? (
        <ul className="search-block-saved__results" role="listbox" aria-label={t(`${p}.listAria`)}>
          {filtered.map((it) => (
            <li key={it.id ?? it.containerNumber} role="none">
              <button
                type="button"
                className="search-block-saved__item"
                role="option"
                onClick={() => handlePick(it.containerNumber)}
                disabled={disabled}
              >
                <span className="search-block-saved__cn">{it.containerNumber}</span>
                {it.clientName ? (
                  <span className="search-block-saved__meta">{it.clientName}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
