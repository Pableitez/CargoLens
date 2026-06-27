import type { OrderEventKind } from "./types";

type TranslateFn = (key: string) => string;

export function eventKindLabel(kind: OrderEventKind, t: TranslateFn): string {
  return t(`ordersPage.eventKind.${kind}`);
}
