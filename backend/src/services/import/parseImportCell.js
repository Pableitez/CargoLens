export function parseDateCell(raw) {
  if (!raw) return null;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}
