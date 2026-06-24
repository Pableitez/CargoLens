export type ShipmentEventKind = "created" | "status_change" | "eta_change" | "note" | "milestone" | "import";

export type ShipmentEvent = {
  id: string;
  kind: ShipmentEventKind;
  message: string;
  actorEmail: string;
  visibleToClient: boolean;
  meta: Record<string, unknown> | null;
  occurredAt: string;
  createdAt: string;
};

export type ShipmentImportPreview = {
  ok: boolean;
  sheet: string;
  rowsTotal: number;
  valid: number;
  invalid: number;
  preview: Array<{ rowNumber: number; reference: string; errors: string[]; valid: boolean }>;
  errors: string[];
};

export type ShipmentImportResult = {
  ok: boolean;
  sheet: string;
  rowsTotal: number;
  created: number;
  skipped: number;
  errors: string[];
};

export type ShipmentStatus = "draft" | "booked" | "in_transit" | "at_port" | "delivered" | "cancelled";

export type ShipmentContainer = {
  containerNumber: string;
  notes?: string;
};

export type Shipment = {
  id: string;
  reference: string;
  origin: string;
  destination: string;
  etd: string | null;
  eta: string | null;
  status: ShipmentStatus;
  notes: string;
  clientId: string | null;
  containers: ShipmentContainer[];
  createdAt: string;
  updatedAt: string;
};

export type PublicShipment = {
  reference: string;
  origin: string;
  destination: string;
  etd: string | null;
  eta: string | null;
  status: ShipmentStatus;
  containers: Pick<ShipmentContainer, "containerNumber">[];
  companyName?: string;
  updatedAt: string;
  events?: ShipmentEvent[];
};

export type ShareLinkResult = {
  item: {
    id: string;
    publicUrl: string;
    expiresAt: string | null;
    revokedAt: string | null;
    createdAt: string;
  };
  token: string;
};

export type ShipmentFormState = {
  reference: string;
  origin: string;
  destination: string;
  etd: string;
  eta: string;
  status: ShipmentStatus;
  notes: string;
  clientId: string;
  containerNumber: string;
};

export const SHIPMENT_STATUS_OPTIONS: ShipmentStatus[] = [
  "draft",
  "booked",
  "in_transit",
  "at_port",
  "delivered",
  "cancelled",
];
