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

export function detectCsvDelimiter(firstLine) {
  const commas = (firstLine.match(/,/g) ?? []).length;
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

function rowsFromWorkbook(workbook, sheetNameFallback = "data") {
  const sheetName = workbook.SheetNames[0] ?? sheetNameFallback;
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return { sheetName: sheetNameFallback, rows: [] };
  }
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return { sheetName, rows };
}

export function readCsvRows(buffer) {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const FS = detectCsvDelimiter(firstLine);
  const workbook = XLSX.read(text, { type: "string", FS });
  const parsed = rowsFromWorkbook(workbook, "csv");
  return { ...parsed, sheetName: "csv" };
}

export function readExcelRows(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  return rowsFromWorkbook(workbook);
}

export function readExcelWorkbook(buffer) {
  return XLSX.read(buffer, { type: "buffer" });
}

/** Reads rows from a sheet by name (case-insensitive). Returns empty rows if sheet is missing. */
export function rowsFromNamedSheet(workbook, sheetName) {
  const target = normalizeHeaderKey(sheetName);
  const sheetKey = workbook.SheetNames.find((name) => normalizeHeaderKey(name) === target);
  if (!sheetKey) {
    return { sheetName, rows: [], found: false };
  }
  const sheet = workbook.Sheets[sheetKey];
  if (!sheet) {
    return { sheetName, rows: [], found: false };
  }
  return {
    sheetName: sheetKey,
    rows: XLSX.utils.sheet_to_json(sheet, { defval: "" }),
    found: true,
  };
}

export function isCsvFilename(filename = "") {
  return String(filename).trim().toLowerCase().endsWith(".csv");
}

export function isExcelFilename(filename = "") {
  return /\.(xlsx|xls)$/i.test(String(filename).trim());
}

/** Lee filas desde CSV (preferido) o Excel legacy. */
export function readSpreadsheetRows(buffer, filename = "") {
  if (isCsvFilename(filename)) {
    return readCsvRows(buffer);
  }
  if (isExcelFilename(filename)) {
    return readExcelRows(buffer);
  }
  // Sin extensión clara: intentar CSV (texto) y si falla, Excel binario.
  try {
    const asCsv = readCsvRows(buffer);
    if (asCsv.rows.length > 0) return asCsv;
  } catch {
    // fallback abajo
  }
  return readExcelRows(buffer);
}

/** @deprecated Usar readSpreadsheetRows */
export function readWorkbookRows(buffer) {
  return readExcelRows(buffer);
}
