import XLSX from "xlsx";

export function normalizeHeaderKey(key) {
  return String(key ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

export function pickCell(row, ...keys) {
  const map = {};
  for (const [k, v] of Object.entries(row)) {
    map[normalizeHeaderKey(k)] = v;
  }
  for (const key of keys) {
    const nk = normalizeHeaderKey(key);
    if (map[nk] !== undefined && map[nk] !== null && String(map[nk]).trim() !== "") {
      return String(map[nk]).trim();
    }
  }
  return "";
}

export function readWorkbookRows(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return { sheetName, rows };
}
