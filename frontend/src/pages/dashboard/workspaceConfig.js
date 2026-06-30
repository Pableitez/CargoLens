// Rutas del dashboard; navegación desde moduleRegistry.ts

import {
  findModuleGroupByRoute,
  getClientDashboardNav,
  getStaffDashboardNav,
} from "../../config/moduleRegistry.ts";

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
    if (pathname.startsWith("/dashboard/operations/export/order")) {
      return titleFromKey(t, "modules.export.order");
    }
    if (pathname.startsWith("/dashboard/operations/export/shipper-booking")) {
      return titleFromKey(t, "modules.export.shipperBooking");
    }
    if (pathname.startsWith("/dashboard/operations/transport/carrier-booking")) {
      return titleFromKey(t, "modules.transport.carrierBooking");
    }
    if (pathname.startsWith("/dashboard/trade-setup")) {
      return titleFromKey(t, "modules.clientAccount.tradeSetup");
    }
    if (pathname.startsWith("/dashboard/messages")) {
      return titleFromKey(t, "messagesPage.title");
    }
    return titleFromKey(t, "modules.nav.home");
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

  return titleFromKey(t, "workspace.section.fallback.topbar");
}
