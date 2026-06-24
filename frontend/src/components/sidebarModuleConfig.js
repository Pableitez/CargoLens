// Secciones del sidebar derivadas de moduleRegistry.ts

import {
  DOCUMENTS_MODULE,
  getClientPlatformNav,
  getStaffPlatformNav,
  INSIGHTS_MODULE,
  OPERATIONS_MODULES,
} from "../config/moduleRegistry.ts";

export const SIDEBAR_LEGACY_LINKS = [
  { id: "clients", route: "/dashboard/clients", i18nKey: "modules.legacy.clients" },
  { id: "add", route: "/dashboard/add", i18nKey: "modules.legacy.addContainer" },
  { id: "import", route: "/dashboard/import", i18nKey: "modules.legacy.importContainers" },
  { id: "list", route: "/dashboard/list", i18nKey: "modules.tracking.savedList" },
  { id: "activity", route: "/dashboard/activity", i18nKey: "modules.legacy.activity" },
  { id: "attention", route: "/dashboard/attention", i18nKey: "modules.tracking.coverage" },
];

export function getSidebarPlatformNav(staff) {
  return staff ? getStaffPlatformNav() : getClientPlatformNav();
}

export function getSidebarOperationGroups(staff) {
  return staff ? OPERATIONS_MODULES : [];
}

export function getSidebarDocumentsGroup(staff) {
  return staff ? DOCUMENTS_MODULE : null;
}

export function getSidebarInsightsGroup(staff) {
  return staff ? INSIGHTS_MODULE : null;
}

export function getSidebarLegacyLinks(staff) {
  return staff ? SIDEBAR_LEGACY_LINKS : [];
}

export function getSidebarOpenInitial() {
  const initial = {
    platform: false,
    documents: false,
    insights: false,
    legacy: false,
    account: false,
  };
  for (const group of OPERATIONS_MODULES) {
    initial[`ops-${group.id}`] = false;
  }
  return initial;
}
