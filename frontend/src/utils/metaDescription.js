import { getWorkspaceTitles } from "../pages/dashboard/workspaceConfig.js";

// Meta description según ruta y sección del dashboard.
export function getMetaDescription(pathname, t, isClientPortal = false) {
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";
  if (path === "/") return t("seo.description.home");
  if (path === "/privacy") return t("seo.description.privacy");
  if (path === "/terms") return t("seo.description.terms");
  if (path === "/vessels") return t("seo.description.vessels");
  if (path === "/login") return t("seo.description.login");
  if (path === "/register") return t("seo.description.register");
  if (path === "/how-it-works" || path.startsWith("/how-it-works/")) return t("seo.description.howItWorks");
  if (path === "/changelog") return t("seo.description.changelog");
  if (path.startsWith("/dashboard")) {
    const { headline } = getWorkspaceTitles(pathname, isClientPortal, t);
    return t("seo.description.dashboard", { section: headline });
  }
  return t("brand.metaDescription");
}
