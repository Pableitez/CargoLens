export type CaseEventKind =
  | "created"
  | "status_change"
  | "note"
  | "milestone"
  | "shipment_linked"
  | "shipment_unlinked";

export type CaseStatus = "draft" | "open" | "in_progress" | "on_hold" | "closed" | "cancelled";

export type CaseTradeDirection = "" | "export" | "import" | "cross_trade";

export type CaseEvent = {
  id: string;
  kind: CaseEventKind;
  message: string;
  actorEmail: string;
  visibleToClient: boolean;
  meta: Record<string, unknown> | null;
  occurredAt: string;
  createdAt: string;
};

export type Case = {
  id: string;
  reference: string;
  title: string;
  status: CaseStatus;
  tradeDirection: CaseTradeDirection;
  incoterm: string;
  origin: string;
  destination: string;
  clientId: string | null;
  shipmentIds: string[];
  openedAt: string | null;
  closedAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CaseFormState = {
  reference: string;
  title: string;
  status: CaseStatus;
  tradeDirection: CaseTradeDirection;
  incoterm: string;
  origin: string;
  destination: string;
  clientId: string;
  openedAt: string;
  closedAt: string;
  notes: string;
};

export const CASE_STATUS_OPTIONS: CaseStatus[] = [
  "draft",
  "open",
  "in_progress",
  "on_hold",
  "closed",
  "cancelled",
];

export const CASE_TRADE_DIRECTION_OPTIONS: CaseTradeDirection[] = ["", "export", "import", "cross_trade"];
