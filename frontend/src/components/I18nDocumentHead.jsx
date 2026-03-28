import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "../i18n/LanguageContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { appName } from "../config/siteMeta.js";
import { getDocumentTitle } from "../utils/pageTitle.js";
import { getMetaDescription } from "../utils/metaDescription.js";

const siteUrl = typeof import.meta.env.VITE_SITE_URL === "string" ? import.meta.env.VITE_SITE_URL.replace(/\/$/, "") : "";

// Sincroniza título, descripción y meta OG/Twitter con idioma y ruta.
export function I18nDocumentHead() {
  const { pathname } = useLocation();
  const { locale, t } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    const pageTitle = getDocumentTitle(pathname, t, !!user?.isClientPortal);
    document.title = `${pageTitle} · ${appName}`;

    const desc = getMetaDescription(pathname, t, !!user?.isClientPortal);
    const m = document.querySelector('meta[name="description"]');
    if (m) m.setAttribute("content", desc);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", document.title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", desc);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const base = siteUrl || origin;
      if (base) ogUrl.setAttribute("content", `${base}${pathname.startsWith("/") ? pathname : `/${pathname}`}`);
    }

    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute("content", document.title);

    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute("content", desc);
  }, [locale, pathname, t, user?.isClientPortal]);

  return null;
}
