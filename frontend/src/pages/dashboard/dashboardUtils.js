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

export function downloadCsvTemplate() {
  const header = "container,client_invite,notes\nMSKU1234567,C1A2B3C,Optional note\n";
  const blob = new Blob([header], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cargolens-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// Exportar filas de contenedores guardados a CSV (lista ya filtrada).
export function downloadSavedContainersCsv(rows, filename = "cargolens-saved-containers.csv") {
  const header = ["container", "client", "notes", "entry_source", "created_utc", "updated_utc"];
  const lines = [header.join(",")];
  for (const r of rows) {
    const created = r.createdAt ? new Date(r.createdAt).toISOString() : "";
    const updated = r.updatedAt ? new Date(r.updatedAt).toISOString() : "";
    const es = r.entrySource;
    const entrySource =
      es === "import" ? "import" : es === "seed" ? "seed" : es === "api" ? "api" : "manual";
    lines.push(
      [
        csvEscape(r.containerNumber),
        csvEscape(r.clientName),
        csvEscape(r.notes),
        csvEscape(entrySource),
        csvEscape(created),
        csvEscape(updated),
      ].join(",")
    );
  }
  const bom = "\uFEFF";
  const blob = new Blob([bom + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
