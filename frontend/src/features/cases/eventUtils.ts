import type { CaseEventKind } from "./types";

type TranslateFn = (key: string) => string;

export function formatEventDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function eventKindLabel(kind: CaseEventKind, t: TranslateFn): string {
  return t(`casesPage.eventKind.${kind}`);
}
