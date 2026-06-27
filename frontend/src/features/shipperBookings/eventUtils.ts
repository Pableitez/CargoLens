import type { ShipperBookingEventKind } from "./types";

type TranslateFn = (key: string) => string;

export function eventKindLabel(kind: ShipperBookingEventKind, t: TranslateFn): string {
  return t(`shipperBookingsPage.eventKind.${kind}`);
}
