import type { TranslateFn } from "../../i18n/useAppTranslation";
import type { ShipmentStatus } from "./types";

export function formatShipmentDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function shipmentStatusLabel(status: ShipmentStatus, t: TranslateFn): string {
  return t(`shipmentsPage.status.${status}`);
}
