const STYLE = {
  IN_TRANSIT: "badge badge--transit",
  AT_PORT: "badge badge--port",
  ARRIVED: "badge badge--port",
  CUSTOMS: "badge badge--customs",
  DELIVERED: "badge badge--done",
};

export function StatusBadge({ code, label }) {
  const cls = STYLE[code] ?? "badge";
  return <span className={cls}>{label ?? code}</span>;
}
