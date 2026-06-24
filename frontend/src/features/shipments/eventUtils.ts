import type { ShipmentEventKind } from "./types";

export function formatEventDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function eventKindLabel(kind: ShipmentEventKind, t: (key: string) => string): string {
  return t(`shipmentsPage.eventKind.${kind}`);
}
