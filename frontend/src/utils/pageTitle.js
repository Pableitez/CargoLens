import { getWorkspaceTitles } from "../pages/dashboard/workspaceConfig.js";

// Título de pestaña según ruta y si es portal cliente.
export function getDocumentTitle(pathname, t, isClientPortal = false) {
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";
  if (path === "/") return t("pageTitle.home");
  if (path === "/privacy") return t("pageTitle.privacy");
  if (path === "/terms") return t("pageTitle.terms");
  if (path === "/vessels") return t("pageTitle.vessels");
  if (path === "/login") return t("pageTitle.login");
  if (path === "/register") return t("pageTitle.register");
  if (path.startsWith("/how-it-works/")) {
    const seg = path.replace("/how-it-works/", "").split("/")[0];
    const key = `howItWorks.pageTitle.${seg}`;
    const resolved = t(key);
    if (resolved !== key) return resolved;
    return t("pageTitle.howItWorks");
  }
  if (path === "/how-it-works") return t("pageTitle.howItWorks");
  if (path === "/changelog") return t("pageTitle.changelog");
  if (path.startsWith("/dashboard")) {
    return getWorkspaceTitles(pathname, isClientPortal, t).headline;
  }
  return t("pageTitle.notFound");
}
