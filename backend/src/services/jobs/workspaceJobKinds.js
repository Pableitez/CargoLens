export const WORKSPACE_JOB_STATUSES = ["pending", "running", "completed", "failed"];

export const WORKSPACE_JOB_KINDS = [
  "import.trade_masters.parties",
  "import.trade_masters.facilities",
  "import.trade_masters.related_parties",
  "import.trade_masters.related_facilities",
  "import.orders",
  "import.shipper_bookings",
];

const TRADE_MASTERS_KIND_MAP = {
  parties: "import.trade_masters.parties",
  facilities: "import.trade_masters.facilities",
  related_parties: "import.trade_masters.related_parties",
  related_facilities: "import.trade_masters.related_facilities",
};

export function tradeMastersKindToJobKind(tradeMastersKind) {
  return TRADE_MASTERS_KIND_MAP[tradeMastersKind] ?? null;
}

export function normalizeWorkspaceJobKind(value) {
  const raw = String(value ?? "").trim();
  if (WORKSPACE_JOB_KINDS.includes(raw)) return raw;
  return tradeMastersKindToJobKind(raw.replace(/-/g, "_"));
}

export function jobKindLabelKey(kind) {
  const map = {
    "import.trade_masters.parties": "backgroundJobs.kind.tradeMastersParties",
    "import.trade_masters.facilities": "backgroundJobs.kind.tradeMastersFacilities",
    "import.trade_masters.related_parties": "backgroundJobs.kind.tradeMastersRelatedParties",
    "import.trade_masters.related_facilities": "backgroundJobs.kind.tradeMastersRelatedFacilities",
    "import.orders": "backgroundJobs.kind.orders",
    "import.shipper_bookings": "backgroundJobs.kind.shipperBookings",
  };
  return map[kind] ?? "backgroundJobs.kind.import";
}
