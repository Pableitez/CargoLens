import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DASHBOARD_OVERVIEW_PATH } from "../config/paths.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useCommandPalette } from "../contexts/CommandPaletteContext.jsx";
import { getWorkspaceNavClient, getWorkspaceNavStaff } from "../pages/dashboard/workspaceConfig.js";
import {
  getPaletteContainerNumbers,
  getRecentRoutes,
  hidePaletteContainerNumber,
} from "../utils/recentPalette.js";
import { useTranslation } from "../i18n/LanguageContext.jsx";

function norm(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function CommandPalette() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { open, close, toggle } = useCommandPalette();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [paletteRev, setPaletteRev] = useState(0);
  const inputRef = useRef(null);

  const isClient = !!user?.isClientPortal;

  const navItems = useMemo(() => {
    const pub = [
      { id: "h", label: t("commandPalette.navHome"), to: "/", kw: "home track" },
      { id: "v", label: t("commandPalette.navVessels"), to: "/vessels", kw: "vessels ships map" },
      { id: "w", label: t("mainLayout.howItWorks"), to: "/how-it-works/track", kw: "how guide" },
      { id: "l", label: t("pageTitle.login"), to: "/login", kw: "login sign" },
      { id: "r", label: t("pageTitle.register"), to: "/register", kw: "register signup" },
    ];
    if (!user) return pub;
    const dash = isClient ? getWorkspaceNavClient(t) : getWorkspaceNavStaff(t);
    const dashItems = dash.map((row, i) => ({
      id: `d${i}`,
      label: row.label,
      to: row.to,
      kw: row.to.replace(/\//g, " "),
    }));
    return [...dashItems, ...pub.filter((p) => p.id !== "l" && p.id !== "r")];
  }, [t, user, isClient]);

  const recentPaths = useMemo(() => getRecentRoutes().slice(0, 10), []);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when palette opens or a row is hidden
  const containerNums = useMemo(() => getPaletteContainerNumbers(), [open, paletteRev]);

  const containerItems = useMemo(
    () =>
      containerNums.map((cn, i) => ({
        id: `c${i}`,
        kind: "container",
        label: cn,
        sublabel: t("commandPalette.openContainer"),
        to: `${DASHBOARD_OVERVIEW_PATH}?q=${encodeURIComponent(cn)}`,
        kw: `${cn} container iso`,
      })),
    [containerNums, t]
  );

  const recentItems = useMemo(() => {
    const out = [];
    const seen = new Set();
    for (const path of recentPaths) {
      const base = path.split("?")[0];
      const match = navItems.find((n) => n.to === base);
      if (match && !seen.has(path)) {
        seen.add(path);
        out.push({
          id: `rc${path}`,
          label: match.label,
          sublabel: path.includes("?") ? path : undefined,
          to: path,
          kw: `${match.label} ${path}`,
        });
      }
    }
    return out;
  }, [recentPaths, navItems]);

  const flat = useMemo(() => {
    const nq = norm(q.trim());
    const score = (item) => {
      if (!nq) return 1;
      const blob = norm(`${item.label} ${item.sublabel || ""} ${item.kw || ""}`);
      return blob.includes(nq) ? 1 : 0;
    };
    const sections = [
      { title: t("commandPalette.sectionNav"), items: navItems },
      ...(containerItems.length ? [{ title: t("commandPalette.sectionContainers"), items: containerItems }] : []),
      ...(recentItems.length ? [{ title: t("commandPalette.sectionRecent"), items: recentItems }] : []),
    ];
    const rows = [];
    for (const sec of sections) {
      for (const it of sec.items) {
        if (score(it)) rows.push({ ...it, sectionTitle: sec.title });
      }
    }
    return rows;
  }, [q, navItems, containerItems, recentItems, t]);

  useEffect(() => {
    setActive(0);
  }, [q, open]);

  useEffect(() => {
    if (!open) {
      setQ("");
      return;
    }
    const t0 = window.setTimeout(() => inputRef.current?.focus(), 10);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t0);
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, close]);

  const go = useCallback(
    (to) => {
      navigate(to);
      close();
    },
    [navigate, close]
  );

  const onKeyDownList = (e) => {
    if (flat.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && flat[active]) {
      e.preventDefault();
      go(flat[active].to);
    }
  };

  if (!open) return null;

  return (
    <div className="command-palette-backdrop" role="presentation" onClick={close}>
      <div
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label={t("commandPalette.title")}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDownList}
      >
        <input
          ref={inputRef}
          type="search"
          className="command-palette__input"
          placeholder={t("commandPalette.placeholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        {flat.length === 0 ? (
          <p className="command-palette__empty">{t("commandPalette.empty")}</p>
        ) : (
          <ul className="command-palette__list" role="listbox">
            {flat.map((row, i) => (
              <li key={row.id} role="option" aria-selected={i === active}>
                {row.kind === "container" ? (
                  <div className="command-palette__item-row">
                    <button
                      type="button"
                      className={`command-palette__item command-palette__item--grow${
                        i === active ? " command-palette__item--active" : ""
                      }`}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(row.to)}
                    >
                      <span className="command-palette__item-label">{row.label}</span>
                      {row.sublabel ? <span className="command-palette__item-sub">{row.sublabel}</span> : null}
                    </button>
                    <button
                      type="button"
                      className="command-palette__item-remove"
                      title={t("commandPalette.removeFromPalette")}
                      aria-label={t("commandPalette.removeFromPaletteAria", { cn: row.label })}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        hidePaletteContainerNumber(row.label);
                        setPaletteRev((r) => r + 1);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={`command-palette__item${i === active ? " command-palette__item--active" : ""}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(row.to)}
                  >
                    <span className="command-palette__item-label">{row.label}</span>
                    {row.sublabel ? <span className="command-palette__item-sub">{row.sublabel}</span> : null}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="command-palette__hint">{t("commandPalette.hint")}</p>
      </div>
    </div>
  );
}
