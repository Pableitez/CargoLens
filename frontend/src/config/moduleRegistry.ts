/** IDs y rutas oficiales — sincronizar con docs/MODULE_REGISTRY.md */

export type SubmoduleDef = {
  id: string;
  route: string;
  i18nKey: string;
  implemented?: boolean;
  staffOnly?: boolean;
};

export type ModuleGroupDef = {
  id: string;
  route: string;
  i18nTitleKey: string;
  i18nLeadKey: string;
  staffOnly?: boolean;
  implemented?: boolean;
  submodules: SubmoduleDef[];
};

export type NavModuleDef = {
  id: string;
  route: string;
  i18nKey: string;
  staffOnly?: boolean;
  end?: boolean;
  implemented?: boolean;
};

export const SIDEBAR_HOME: NavModuleDef = {
  id: "home",
  route: "/dashboard/home",
  i18nKey: "modules.nav.home",
  end: true,
};

/** @deprecated Use getStaffDashboardNav / getClientDashboardNav instead. */
export const PLATFORM_NAV: NavModuleDef[] = [SIDEBAR_HOME];

export function getStaffDashboardNav(): NavModuleDef[] {
  return [SIDEBAR_HOME];
}

export function getClientDashboardNav(): NavModuleDef[] {
  return [
    SIDEBAR_HOME,
    {
      id: "tradeSetup",
      route: "/dashboard/trade-setup",
      i18nKey: "modules.clientAccount.tradeSetup",
      implemented: true,
    },
    {
      id: "messages",
      route: "/dashboard/messages",
      i18nKey: "modules.insights.customerMessagingService",
      implemented: true,
    },
  ];
}

export function getStaffPlatformNav(): NavModuleDef[] {
  return getStaffDashboardNav();
}

export function getClientPlatformNav(): NavModuleDef[] {
  return getClientDashboardNav();
}

export const OPERATIONS_MODULES: ModuleGroupDef[] = [
  {
    id: "export",
    route: "/dashboard/operations/export",
    i18nTitleKey: "modules.export.title",
    i18nLeadKey: "modules.export.lead",
    staffOnly: true,
    submodules: [
      {
        id: "order",
        route: "/dashboard/operations/export/order",
        i18nKey: "modules.export.order",
        implemented: true,
      },
      {
        id: "shipperBooking",
        route: "/dashboard/operations/export/shipper-booking",
        i18nKey: "modules.export.shipperBooking",
        implemented: true,
      },
      {
        id: "exportCustoms",
        route: "/dashboard/operations/export/export-customs",
        i18nKey: "modules.export.exportCustoms",
      },
    ],
  },
  {
    id: "transport",
    route: "/dashboard/operations/transport",
    i18nTitleKey: "modules.transport.title",
    i18nLeadKey: "modules.transport.lead",
    staffOnly: true,
    submodules: [
      {
        id: "carrierBooking",
        route: "/dashboard/operations/transport/carrier-booking",
        i18nKey: "modules.transport.carrierBooking",
      },
      {
        id: "shippingInstructions",
        route: "/dashboard/operations/transport/shipping-instructions",
        i18nKey: "modules.transport.shippingInstructions",
      },
      {
        id: "verifiedGrossMass",
        route: "/dashboard/operations/transport/verified-gross-mass",
        i18nKey: "modules.transport.verifiedGrossMass",
      },
      {
        id: "schedules",
        route: "/dashboard/operations/transport/schedules",
        i18nKey: "modules.transport.schedules",
      },
      {
        id: "allocationUtilization",
        route: "/dashboard/operations/transport/allocation-utilization",
        i18nKey: "modules.transport.allocationUtilization",
      },
    ],
  },
  {
    id: "warehouse",
    route: "/dashboard/operations/warehouse",
    i18nTitleKey: "modules.warehouse.title",
    i18nLeadKey: "modules.warehouse.lead",
    staffOnly: true,
    submodules: [
      {
        id: "receiving",
        route: "/dashboard/operations/warehouse/receiving",
        i18nKey: "modules.warehouse.receiving",
      },
      {
        id: "cargoStuffing",
        route: "/dashboard/operations/warehouse/cargo-stuffing",
        i18nKey: "modules.warehouse.cargoStuffing",
      },
    ],
  },
  {
    id: "import",
    route: "/dashboard/operations/import",
    i18nTitleKey: "modules.import.title",
    i18nLeadKey: "modules.import.lead",
    staffOnly: true,
    submodules: [
      {
        id: "arrivalManagement",
        route: "/dashboard/operations/import/arrival-management",
        i18nKey: "modules.import.arrivalManagement",
      },
      {
        id: "carrierRelease",
        route: "/dashboard/operations/import/carrier-release",
        i18nKey: "modules.import.carrierRelease",
      },
      {
        id: "importCustoms",
        route: "/dashboard/operations/import/import-customs",
        i18nKey: "modules.import.importCustoms",
      },
      {
        id: "deliveryPlanning",
        route: "/dashboard/operations/import/delivery-planning",
        i18nKey: "modules.import.deliveryPlanning",
      },
      {
        id: "exceptionManagement",
        route: "/dashboard/operations/import/exception-management",
        i18nKey: "modules.import.exceptionManagement",
      },
      {
        id: "nonNetworkShipments",
        route: "/dashboard/operations/import/non-network-shipments",
        i18nKey: "modules.import.nonNetworkShipments",
      },
    ],
  },
];

export const DOCUMENTS_MODULE: ModuleGroupDef = {
  id: "documents",
  route: "/dashboard/documents",
  i18nTitleKey: "modules.documents.title",
  i18nLeadKey: "modules.documents.lead",
  staffOnly: true,
  submodules: [
    {
      id: "documentManagement",
      route: "/dashboard/documents/document-management",
      i18nKey: "modules.documents.documentManagement",
    },
    {
      id: "forwardersCargoReceipt",
      route: "/dashboard/documents/forwarders-cargo-receipt",
      i18nKey: "modules.documents.forwardersCargoReceipt",
    },
    {
      id: "commercialInvoices",
      route: "/dashboard/documents/commercial-invoices",
      i18nKey: "modules.documents.commercialInvoices",
    },
    {
      id: "exceptionManagement",
      route: "/dashboard/documents/exception-management",
      i18nKey: "modules.documents.exceptionManagement",
    },
    {
      id: "packingList",
      route: "/dashboard/documents/packing-list",
      i18nKey: "modules.documents.packingList",
    },
  ],
};

export const INSIGHTS_MODULE: ModuleGroupDef = {
  id: "insights",
  route: "/dashboard/insights",
  i18nTitleKey: "modules.insights.title",
  i18nLeadKey: "modules.insights.lead",
  staffOnly: true,
  submodules: [
    {
      id: "supplyChainIntelligence",
      route: "/dashboard/insights/supply-chain-intelligence",
      i18nKey: "modules.insights.supplyChainIntelligence",
    },
    { id: "reporting", route: "/dashboard/insights/reporting", i18nKey: "modules.insights.reporting" },
    {
      id: "customerMessagingService",
      route: "/dashboard/messages",
      i18nKey: "modules.insights.customerMessagingService",
      implemented: true,
    },
  ],
};

export const TRACKING_LINKS: SubmoduleDef[] = [
  {
    id: "overview",
    route: "/dashboard/tracking/overview",
    i18nKey: "modules.tracking.overview",
    implemented: true,
  },
  { id: "savedList", route: "/dashboard/list", i18nKey: "modules.tracking.savedList", implemented: true },
  { id: "coverage", route: "/dashboard/attention", i18nKey: "modules.tracking.coverage", implemented: true },
  { id: "vessels", route: "/vessels", i18nKey: "modules.tracking.vessels", implemented: true },
];

/** Per-contractual account tools — staff manages all clients; portal users see their own trade setup. */
export const CLIENT_ACCOUNT_LINKS: SubmoduleDef[] = [
  {
    id: "tradeSetupStaff",
    route: "/dashboard/clients/parties",
    i18nKey: "modules.settings.parties",
    implemented: true,
    staffOnly: true,
  },
  {
    id: "tradeSetupPortal",
    route: "/dashboard/trade-setup",
    i18nKey: "modules.clientAccount.tradeSetup",
    implemented: true,
    staffOnly: false,
  },
];

/** Staff settings — party directory + facilities catalog. */
export const SETTINGS_LINKS: SubmoduleDef[] = [
  {
    id: "parties",
    route: "/dashboard/clients/parties",
    i18nKey: "modules.settings.parties",
    implemented: true,
  },
  {
    id: "facilities",
    route: "/dashboard/clients/facilities",
    i18nKey: "modules.settings.facilities",
    implemented: true,
  },
  {
    id: "relationships",
    route: "/dashboard/clients/relationships",
    i18nKey: "modules.settings.relationships",
    implemented: true,
  },
];

export const SETTINGS_MODULE: ModuleGroupDef = {
  id: "settings",
  route: "/dashboard/settings",
  i18nTitleKey: "modules.settings.title",
  i18nLeadKey: "modules.settings.lead",
  staffOnly: true,
  implemented: true,
  submodules: SETTINGS_LINKS,
};

/** Staff-only container workspace — Tracking dropdown (not account settings). */
export const STAFF_TRACKING_CONTAINER_LINKS: SubmoduleDef[] = [
  { id: "add", route: "/dashboard/add", i18nKey: "modules.workspaceTools.addContainer", implemented: true },
  {
    id: "import",
    route: "/dashboard/import",
    i18nKey: "modules.workspaceTools.importContainers",
    implemented: true,
  },
  {
    id: "activity",
    route: "/dashboard/activity",
    i18nKey: "modules.workspaceTools.activity",
    implemented: true,
  },
];

/** @deprecated Prefer SETTINGS_LINKS + STAFF_TRACKING_CONTAINER_LINKS. */
export const STAFF_WORKSPACE_TOOL_LINKS: SubmoduleDef[] = [
  ...SETTINGS_LINKS,
  ...STAFF_TRACKING_CONTAINER_LINKS,
];

/** Tracking en la topbar (derecha) — no en sidebar ni workspace-nav. */
export const GUEST_TRACKING_TOPBAR_LINKS: SubmoduleDef[] = [
  { id: "search", route: "/track", i18nKey: "modules.tracking.search", implemented: true },
  { id: "vessels", route: "/vessels", i18nKey: "modules.tracking.vessels", implemented: true },
];

export const CLIENT_TRACKING_TOPBAR_LINKS: SubmoduleDef[] = [
  {
    id: "search",
    route: "/dashboard/tracking/overview",
    i18nKey: "modules.tracking.search",
    implemented: true,
  },
  { id: "savedList", route: "/dashboard/list", i18nKey: "modules.tracking.savedList", implemented: true },
];

export const STAFF_TRACKING_TOPBAR_LINKS: SubmoduleDef[] = [
  {
    id: "search",
    route: "/dashboard/tracking/overview",
    i18nKey: "modules.tracking.search",
    implemented: true,
  },
  ...TRACKING_LINKS,
];

export function findModuleGroupByRoute(pathname: string): ModuleGroupDef | undefined {
  const all = [...OPERATIONS_MODULES, DOCUMENTS_MODULE, INSIGHTS_MODULE, SETTINGS_MODULE];
  return all.find((g) => pathname === g.route || pathname.startsWith(`${g.route}/`));
}
