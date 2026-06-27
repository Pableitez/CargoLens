import { downloadBlob } from "./downloadBlob";

const CSV_SEP = ";";

export function csvEscape(value: unknown) {
  const s = String(value ?? "");
  if (/[";\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadCsvFile(headers: string[], rows: unknown[][], filename: string) {
  const lines = [headers.map(csvEscape).join(CSV_SEP)];
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(CSV_SEP));
  }
  const bom = "\uFEFF";
  downloadBlob(new Blob([bom + lines.join("\n")], { type: "text/csv;charset=utf-8" }), filename);
}

export function datedExportFilename(prefix: string) {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}-${date}.csv`;
}
