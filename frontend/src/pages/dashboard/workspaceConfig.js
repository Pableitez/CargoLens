// Rutas del dashboard y segmento actual; textos vía `t`.

/** @type {Record<string, string>} */
const STAFF_SEGMENT_KEYS = {
  overview: "overview",
  clients: "clients",
  add: "add",
  import: "import",
  list: "list",
  activity: "activity",
  attention: "attention",
  settings: "settings",
};

// Enlaces de navegación staff (sidebar).
export function getWorkspaceNavStaff(t) {
  return [
    { to: "/dashboard/overview", label: t("workspace.nav.overview"), end: true },
    { to: "/dashboard/clients", label: t("workspace.nav.clients") },
    { to: "/dashboard/add", label: t("workspace.nav.add") },
    { to: "/dashboard/import", label: t("workspace.nav.import") },
    { to: "/dashboard/list", label: t("workspace.nav.list") },
    { to: "/dashboard/activity", label: t("workspace.nav.activity") },
    { to: "/dashboard/attention", label: t("workspace.nav.attention") },
    { to: "/dashboard/settings", label: t("workspace.nav.settings") },
  ];
}

// Enlaces de navegación portal cliente.
export function getWorkspaceNavClient(t) {
  return [
    { to: "/dashboard/overview", label: t("workspace.nav.overview"), end: true },
    { to: "/dashboard/list", label: t("workspace.nav.list") },
  ];
}

// Segmento tras /dashboard/ (por defecto overview).
export function getDashboardSegment(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "dashboard") return "overview";
  return parts[1] ?? "overview";
}

// Título topbar + H1 según sección y rol.
export function getWorkspaceTitles(pathname, isClientPortal, t) {
  const segment = getDashboardSegment(pathname);
  if (isClientPortal) {
    if (segment === "list") {
      return {
        topbar: t("workspace.section.clientList.topbar"),
        headline: t("workspace.section.clientList.headline"),
      };
    }
    return {
      topbar: t("workspace.section.clientDefault.topbar"),
      headline: t("workspace.section.clientDefault.headline"),
    };
  }
  const key = STAFF_SEGMENT_KEYS[segment] ?? "fallback";
  return {
    topbar: t(`workspace.section.${key}.topbar`),
    headline: t(`workspace.section.${key}.headline`),
  };
}
