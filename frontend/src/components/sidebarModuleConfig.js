// Secciones del sidebar derivadas de moduleRegistry.ts

import {
  DOCUMENTS_MODULE,
  getClientPlatformNav,
  getStaffPlatformNav,
  INSIGHTS_MODULE,
  OPERATIONS_MODULES,
} from "../config/moduleRegistry.ts";

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

export function getSidebarOpenInitial() {
  const initial = {
    platform: false,
    documents: false,
    insights: false,
    account: false,
  };
  for (const group of OPERATIONS_MODULES) {
    initial[`ops-${group.id}`] = false;
  }
  return initial;
}
