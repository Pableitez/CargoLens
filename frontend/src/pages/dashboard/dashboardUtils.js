// ISO si la fecha es válida; si no, null.
export function parseValidDateIso(value) {
  if (value == null || value === "") return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

export function formatShortDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  try {
    return d.toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

// Fecha/hora con zona corta (actividad / auditoría).
export function formatDateTimeWithZone(iso, locale = undefined) {
  if (iso == null || iso === "") return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  try {
    const loc = locale || (typeof navigator !== "undefined" ? navigator.language : "en-GB");
    return d.toLocaleString(loc, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZoneName: "short",
    });
  } catch {
    return "—";
  }
}
