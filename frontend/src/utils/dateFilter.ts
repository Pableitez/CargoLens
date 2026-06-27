/** Normalize API / ISO timestamps to YYYY-MM-DD in local time for filter matching. */
export function toFilterDateKey(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatFilterDateLabel(isoDate: string): string {
  const trimmed = isoDate.trim();
  if (!trimmed) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return trimmed;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return trimmed;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
