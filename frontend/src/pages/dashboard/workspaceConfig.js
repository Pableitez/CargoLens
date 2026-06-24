// Rutas del dashboard; navegación desde moduleRegistry.ts

import {
  findModuleGroupByRoute,
  getClientPlatformNav,
  getStaffPlatformNav,
} from "../../config/moduleRegistry.ts";

/** @typedef {{ to: string; label: string; end?: boolean }} NavItem */

/** @param {import('../../i18n/LanguageContext.jsx').TranslateFn} t */
export function getWorkspaceNavStaff(t) {
  return getStaffPlatformNav().map((item) => ({
    to: item.route,
    label: t(item.i18nKey),
    end: Boolean(item.end),
  }));
}

/** @param {import('../../i18n/LanguageContext.jsx').TranslateFn} t */
export function getWorkspaceNavClient(t) {
  return getClientPlatformNav().map((item) => ({
    to: item.route,
    label: t(item.i18nKey),
    end: Boolean(item.end),
  }));
}

// Segmento principal tras /dashboard/ (por defecto home).
export function getDashboardSegment(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "dashboard") return "home";
  return parts[1] ?? "home";
}

/** @param {import('../../i18n/LanguageContext.jsx').TranslateFn} t */
function titleFromKey(t, key) {
  return { topbar: t(key), headline: t(key) };
}

/** @param {string} pathname @param {boolean} isClientPortal @param {import('../../i18n/LanguageContext.jsx').TranslateFn} t */
export function getWorkspaceTitles(pathname, isClientPortal, t) {
  if (isClientPortal) {
    if (pathname.startsWith("/dashboard/list")) {
      return {
        topbar: t("workspace.section.clientList.topbar"),
        headline: t("workspace.section.clientList.headline"),
      };
    }
    if (pathname.startsWith("/dashboard/tracking")) {
      return titleFromKey(t, "modules.tracking.title");
    }
    return titleFromKey(t, "modules.nav.home");
  }

  if (pathname === "/dashboard/overview" || pathname.startsWith("/dashboard/home")) {
    return titleFromKey(t, "modules.nav.home");
  }
  if (pathname.startsWith("/dashboard/cases")) {
    return titleFromKey(t, "modules.cases.title");
  }
  if (pathname.startsWith("/dashboard/shipments/import")) {
    return titleFromKey(t, "modules.nav.shipments");
  }
  if (pathname.startsWith("/dashboard/shipments")) {
    return titleFromKey(t, "modules.nav.shipments");
  }
  if (pathname.startsWith("/dashboard/tracking")) {
    return titleFromKey(t, "modules.tracking.title");
  }
  if (pathname.startsWith("/dashboard/operational-finance")) {
    return titleFromKey(t, "modules.operationalFinance.title");
  }
  if (pathname.startsWith("/dashboard/tasks")) {
    return titleFromKey(t, "modules.tasks.title");
  }
  if (pathname.startsWith("/dashboard/operations")) {
    const group = findModuleGroupByRoute(pathname);
    if (group) {
      const sub = group.submodules.find((s) => pathname === s.route || pathname.startsWith(`${s.route}/`));
      if (sub) return titleFromKey(t, sub.i18nKey);
      return titleFromKey(t, group.i18nTitleKey);
    }
    return titleFromKey(t, "modules.operations.indexTitle");
  }
  if (pathname.startsWith("/dashboard/documents")) {
    const group = findModuleGroupByRoute(pathname);
    if (group) {
      const sub = group.submodules.find((s) => pathname === s.route);
      if (sub) return titleFromKey(t, sub.i18nKey);
    }
    return titleFromKey(t, "modules.documents.title");
  }
  if (pathname.startsWith("/dashboard/insights")) {
    const group = findModuleGroupByRoute(pathname);
    if (group) {
      const sub = group.submodules.find((s) => pathname === s.route);
      if (sub) return titleFromKey(t, sub.i18nKey);
    }
    return titleFromKey(t, "modules.insights.title");
  }

  /** @type {Record<string, string>} */
  const workspaceToolTitleKeys = {
    clients: "workspace.section.clients.topbar",
    add: "workspace.section.add.topbar",
    import: "workspace.section.import.topbar",
    list: "workspace.section.list.topbar",
    activity: "workspace.section.activity.topbar",
    attention: "workspace.section.attention.topbar",
    settings: "workspace.section.settings.topbar",
  };
  const segment = getDashboardSegment(pathname);
  const toolTitleKey = workspaceToolTitleKeys[segment];
  if (toolTitleKey) return titleFromKey(t, toolTitleKey);

  return titleFromKey(t, "workspace.section.fallback.topbar");
}
