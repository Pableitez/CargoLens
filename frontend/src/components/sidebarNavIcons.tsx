import type { ComponentType, ReactNode } from "react";

type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      {children}
    </svg>
  );
}

function IconHome({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconOrder({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M8 6h8M8 10h8M8 14h5M7 4h10a2 2 0 012 2v14l-3-2-3 2-3-2-3 2V6a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconBooking({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M7 4v2M17 4v2M4 9h16M6 6h12a2 2 0 012 2v11H4V8a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconExport({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M12 16V6M12 6l-3.5 3.5M12 6l3.5 3.5M5 18h14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconImport({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M12 8v10M12 18l-3.5-3.5M12 18l3.5-3.5M5 6h14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconTransport({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M3 8h11v8H3V8zm11 2h3l2 3v3h-5v-6zM7 16a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm10 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconShip({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M4 14l2 5h12l2-5M6 14h12l-2-9H8L6 14zM9 5h6l-1-2h-4L9 5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconWarehouse({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M4 10l8-5 8 5v9H4v-9zm4 4h8v5H8v-5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconDocuments({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M8 4h8l4 4v12H8V4zm8 0v4h4M10 12h8M10 16h6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconInsights({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconMessages({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M5 6h14a1 1 0 011 1v9a1 1 0 01-1 1H9l-4 3V7a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconParties({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconFacilities({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="1.75" />
    </Svg>
  );
}

function IconSettings({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconCustoms({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M12 3l7 4v6c0 4-3.5 7-7 8-3.5-1-7-4-7-8V7l7-4z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </Svg>
  );
}

function IconList({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconAccount({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconOperations({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </Svg>
  );
}

function IconDefault({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </Svg>
  );
}

const ICON_BY_MODULE: Record<string, ComponentType<IconProps>> = {
  home: IconHome,
  operations: IconOperations,
  order: IconOrder,
  shipperBooking: IconBooking,
  exportCustoms: IconCustoms,
  export: IconExport,
  transport: IconTransport,
  carrierBooking: IconShip,
  shippingInstructions: IconDocuments,
  verifiedGrossMass: IconList,
  schedules: IconList,
  allocationUtilization: IconInsights,
  warehouse: IconWarehouse,
  receiving: IconImport,
  cargoStuffing: IconWarehouse,
  import: IconImport,
  arrivalManagement: IconImport,
  carrierRelease: IconShip,
  importCustoms: IconCustoms,
  deliveryPlanning: IconTransport,
  exceptionManagement: IconList,
  nonNetworkShipments: IconTransport,
  documents: IconDocuments,
  documentManagement: IconDocuments,
  forwardersCargoReceipt: IconDocuments,
  commercialInvoices: IconDocuments,
  packingList: IconDocuments,
  insights: IconInsights,
  supplyChainIntelligence: IconInsights,
  reporting: IconInsights,
  customerMessagingService: IconMessages,
  messages: IconMessages,
  tradeSetup: IconParties,
  tradeSetupStaff: IconParties,
  tradeSetupPortal: IconParties,
  parties: IconParties,
  facilities: IconFacilities,
  settings: IconSettings,
  account: IconAccount,
};

export function SidebarNavIcon({
  moduleId,
  className = "sidebar__icon",
}: {
  moduleId: string;
  className?: string;
}) {
  const Icon = ICON_BY_MODULE[moduleId] ?? IconDefault;
  return <Icon className={className} />;
}

/** Resolve sectionId like `ops-export` → `export`. */
export function sidebarIconModuleId(moduleOrSectionId: string) {
  if (moduleOrSectionId.startsWith("ops-")) {
    return moduleOrSectionId.slice(4);
  }
  return moduleOrSectionId;
}
