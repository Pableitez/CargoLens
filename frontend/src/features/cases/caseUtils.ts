import type { CaseStatus, CaseTradeDirection } from "./types";

type TranslateFn = (key: string) => string;

export function formatCaseDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function caseStatusLabel(status: CaseStatus, t: TranslateFn): string {
  return t(`casesPage.status.${status}`);
}

export function tradeDirectionLabel(direction: CaseTradeDirection, t: TranslateFn): string {
  if (!direction) return "—";
  return t(`casesPage.tradeDirection.${direction}`);
}
