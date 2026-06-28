// Secciones del sidebar derivadas de moduleRegistry.ts

import {
  DOCUMENTS_MODULE,
  INSIGHTS_MODULE,
  OPERATIONS_MODULES,
  SETTINGS_MODULE,
  SIDEBAR_HOME,
} from "../config/moduleRegistry.ts";

export function getSidebarHomeLink() {
  return SIDEBAR_HOME;
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

export function getSidebarSettingsGroup(staff) {
  return staff ? SETTINGS_MODULE : null;
}

export function getSidebarOpenInitial() {
  const initial = {
    platform: false,
    documents: false,
    insights: false,
    settings: false,
    account: false,
  };
  for (const group of OPERATIONS_MODULES) {
    initial[`ops-${group.id}`] = false;
  }
  return initial;
}
