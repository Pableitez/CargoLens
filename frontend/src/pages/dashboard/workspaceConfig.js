// Rutas del dashboard; navegación desde moduleRegistry.ts

import {
  findModuleGroupByRoute,
  getClientDashboardNav,
  getStaffDashboardNav,
} from "../../config/moduleRegistry.ts";

/** @typedef {{ to: string; label: string; end?: boolean }} NavItem */

/** @param {import('../../i18n/LanguageContext.jsx').TranslateFn} t */
export function getWorkspaceNavStaff(t) {
  return getStaffDashboardNav().map((item) => ({
    to: item.route,
    label: t(item.i18nKey),
    end: Boolean(item.end),
  }));
}

/** @param {import('../../i18n/LanguageContext.jsx').TranslateFn} t */
export function getWorkspaceNavClient(t) {
  return getClientDashboardNav().map((item) => ({
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

function noTopbarTitle() {
  return { topbar: null, headline: null };
}

/** @param {string} pathname @param {boolean} isClientPortal @param {import('../../i18n/LanguageContext.jsx').TranslateFn} t */
export function getWorkspaceTitles(pathname, isClientPortal, t) {
  if (pathname === "/dashboard/overview" || pathname.startsWith("/dashboard/home")) {
    return noTopbarTitle();
  }

  if (isClientPortal) {
    if (pathname.startsWith("/dashboard/trade-setup")) {
      return titleFromKey(t, "modules.clientAccount.tradeSetup");
    }
    if (pathname.startsWith("/dashboard/messages")) {
      return titleFromKey(t, "messagesPage.title");
    }
    if (pathname.startsWith("/dashboard/list")) {
      return {
        topbar: t("workspace.section.clientList.topbar"),
        headline: t("workspace.section.clientList.headline"),
      };
    }
    if (pathname.startsWith("/dashboard/tracking/overview")) {
      return titleFromKey(t, "modules.tracking.overview");
    }
    if (pathname.startsWith("/dashboard/tracking")) {
      return titleFromKey(t, "modules.tracking.title");
    }
    return titleFromKey(t, "modules.nav.home");
  }

  if (pathname.startsWith("/dashboard/tracking/overview")) {
    return titleFromKey(t, "modules.tracking.overview");
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
      if (pathname === group.route) {
        return titleFromKey(t, group.i18nTitleKey);
      }
      const sub = group.submodules.find((s) => pathname === s.route || pathname.startsWith(`${s.route}/`));
      if (sub) {
        if (pathname === sub.route) {
          return titleFromKey(t, sub.i18nKey);
        }
        return titleFromKey(t, sub.i18nKey);
      }
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
  if (pathname.startsWith("/dashboard/messages")) {
    return titleFromKey(t, "messagesPage.title");
  }
  if (pathname.startsWith("/dashboard/settings")) {
    return titleFromKey(t, "modules.settings.title");
  }
  if (pathname.startsWith("/dashboard/clients/facilities")) {
    return titleFromKey(t, "modules.settings.facilities");
  }
  if (
    pathname.startsWith("/dashboard/clients/parties") ||
    pathname.startsWith("/dashboard/clients/trade-setup")
  ) {
    return titleFromKey(t, "modules.settings.parties");
  }
  if (pathname.startsWith("/dashboard/clients")) {
    return titleFromKey(t, "modules.settings.parties");
  }

  /** @type {Record<string, string>} */
  const workspaceToolTitleKeys = {
    clients: "workspace.section.clients.topbar",
    add: "workspace.section.add.topbar",
    import: "workspace.section.import.topbar",
    list: "workspace.section.list.topbar",
    activity: "workspace.section.activity.topbar",
    attention: "workspace.section.attention.topbar",
  };
  const segment = getDashboardSegment(pathname);
  const toolTitleKey = workspaceToolTitleKeys[segment];
  if (toolTitleKey) return titleFromKey(t, toolTitleKey);

  return titleFromKey(t, "workspace.section.fallback.topbar");
}
