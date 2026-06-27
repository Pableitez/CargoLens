export const BE_CODE_LENGTH = 9;

export const BE_CODE_CUSTOM_FUNCTION = "__custom__";

/** Suggested 2-letter function suffixes (custom values also allowed). */
export const BE_CODE_SUGGESTED_FUNCTION_CODES = Object.freeze([
  "HQ",
  "VD",
  "WH",
  "PL",
  "OF",
  "BR",
  "DC",
  "SH",
  "CN",
  "AG",
  "FW",
  "OT",
]);

/** @deprecated use BE_CODE_SUGGESTED_FUNCTION_CODES */
export const BE_CODE_FUNCTION_CODES = BE_CODE_SUGGESTED_FUNCTION_CODES;

const LEGAL_SUFFIX_PATTERN =
  /\b(S\.?\s*A\.?|S\.?\s*L\.?|S\.?\s*L\.?\s*U\.?|B\.?\s*V\.?|N\.?\s*V\.?|LTD|LLC|INC|GMBH|AB|CORP|CORPORATION|COMPANY|CO|GROUP|HOLDING|LIMITED)\b/gi;

export function normalizeBeCode(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, BE_CODE_LENGTH);
}

export function normalizeBeFunctionCode(value) {
  return normalizeBeCode(value).slice(0, 2);
}

export function isValidBeFunctionCode(value) {
  const fn = normalizeBeFunctionCode(value);
  return /^[A-Z0-9]{2}$/.test(fn);
}

export function suggestBeNameKey(legalName) {
  const stripped = String(legalName ?? "")
    .replace(LEGAL_SUFFIX_PATTERN, " ")
    .trim();
  const normalized = normalizeBeCode(stripped);
  if (!normalized) return "";

  const words = stripped
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    const acronym = words.map((word) => word[0]).join("");
    if (acronym.length >= 3) return acronym.slice(0, 5).padEnd(5, "X");
  }

  return normalized.slice(0, 5).padEnd(5, "X");
}

export function parseBeCode(value) {
  const normalized = normalizeBeCode(value);
  if (normalized.length !== BE_CODE_LENGTH) return null;
  return {
    country: normalized.slice(0, 2),
    nameKey: normalized.slice(2, 7),
    functionCode: normalized.slice(7, 9),
  };
}

export function isValidBeCode(value) {
  const parsed = parseBeCode(value);
  if (!parsed) return false;
  if (!/^[A-Z]{2}$/.test(parsed.country)) return false;
  if (!/^[A-Z0-9]{5}$/.test(parsed.nameKey)) return false;
  return isValidBeFunctionCode(parsed.functionCode);
}

export function beCodeValidationError(value) {
  const normalized = normalizeBeCode(value);
  if (!normalized) return "code is required.";
  if (normalized.length !== BE_CODE_LENGTH) {
    return `code must be ${BE_CODE_LENGTH} characters: 2 country + 5 name + 2 function (e.g. ESINDITHQ).`;
  }
  const parsed = parseBeCode(normalized);
  if (!/^[A-Z]{2}$/.test(parsed.country)) {
    return "code country prefix must be 2 letters (ISO country, e.g. ES).";
  }
  if (!/^[A-Z0-9]{5}$/.test(parsed.nameKey)) {
    return "code name segment must be 5 letters or digits.";
  }
  if (!isValidBeFunctionCode(parsed.functionCode)) {
    return "code function suffix must be 2 letters or digits.";
  }
  return null;
}

/** Build a BE code from ISO country, legal name, and function suffix. */
export function suggestBeCode({ country = "", legalName = "", functionCode = "HQ" } = {}) {
  const countryPart = normalizeBeCode(country)
    .replace(/[^A-Z]/g, "")
    .slice(0, 2);
  const namePart = suggestBeNameKey(legalName);
  const fnPart = normalizeBeFunctionCode(functionCode);
  if (countryPart.length < 2 || namePart.length < 5 || !isValidBeFunctionCode(fnPart)) return "";
  return `${countryPart}${namePart}${fnPart}`;
}
