export const FACILITY_CODE_LENGTH = 8;

/** Ports / terminals always use this 3-letter function segment. */
export const FACILITY_PORT_FUNCTION = "TRM";

export const FACILITY_CUSTOM_FUNCTION = "__custom__";

/** Suggested 3-letter function suffixes for manual facilities. */
export const FACILITY_SUGGESTED_FUNCTION_CODES = Object.freeze([
  FACILITY_PORT_FUNCTION,
  "WHS",
  "PLT",
  "OFC",
  "DCX",
  "OTH",
]);

/** @deprecated use FACILITY_SUGGESTED_FUNCTION_CODES */
export const FACILITY_MANUAL_FUNCTION_CODES = FACILITY_SUGGESTED_FUNCTION_CODES;

/** @deprecated use FACILITY_SUGGESTED_FUNCTION_CODES + TRM */
export const FACILITY_FUNCTION_CODES = Object.freeze([
  FACILITY_PORT_FUNCTION,
  ...FACILITY_SUGGESTED_FUNCTION_CODES,
]);

const LEGAL_SUFFIX_PATTERN =
  /\b(S\.?\s*A\.?|S\.?\s*L\.?|S\.?\s*L\.?\s*U\.?|B\.?\s*V\.?|N\.?\s*V\.?|LTD|LLC|INC|GMBH|AB|CORP|CORPORATION|COMPANY|CO|GROUP|HOLDING|LIMITED)\b/gi;

export function normalizeFacilityCode(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, FACILITY_CODE_LENGTH);
}

export function normalizeFacilityFunctionCode(value) {
  return normalizeFacilityCode(value).slice(0, 3);
}

export function isValidFacilityFunctionCode(value) {
  const fn = normalizeFacilityFunctionCode(value);
  return /^[A-Z0-9]{3}$/.test(fn);
}

export function suggestFacilityLocationKey(name, city = "") {
  const stripped = String(name ?? "")
    .replace(LEGAL_SUFFIX_PATTERN, " ")
    .trim();
  const words = stripped
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    const acronym = words.map((word) => word[0]).join("");
    if (acronym.length >= 2) return acronym.slice(0, 3).padEnd(3, "X");
  }

  const normalized = normalizeFacilityCode(stripped);
  if (normalized.length >= 3) return normalized.slice(0, 3);
  if (normalized.length >= 1) return normalized.padEnd(3, "X");

  const cityPart = normalizeFacilityCode(city).slice(0, 3);
  if (cityPart.length >= 1) return cityPart.padEnd(3, "X");
  return "";
}

export function parseFacilityCode(value) {
  const normalized = normalizeFacilityCode(value);
  if (normalized.length !== FACILITY_CODE_LENGTH) return null;
  return {
    country: normalized.slice(0, 2),
    locationKey: normalized.slice(2, 5),
    functionCode: normalized.slice(5, 8),
  };
}

export function isValidFacilityCode(value) {
  const parsed = parseFacilityCode(value);
  if (!parsed) return false;
  if (!/^[A-Z]{2}$/.test(parsed.country)) return false;
  if (!/^[A-Z0-9]{3}$/.test(parsed.locationKey)) return false;
  return isValidFacilityFunctionCode(parsed.functionCode);
}

export function facilityCodeValidationError(value, { allowPortFunction = false } = {}) {
  const normalized = normalizeFacilityCode(value);
  if (!normalized) return "code is required.";
  if (normalized.length !== FACILITY_CODE_LENGTH) {
    return `code must be ${FACILITY_CODE_LENGTH} characters: 2 country + 3 location + 3 function (e.g. ESVCITRM).`;
  }
  const parsed = parseFacilityCode(normalized);
  if (!/^[A-Z]{2}$/.test(parsed.country)) {
    return "code country prefix must be 2 letters (ISO country, e.g. ES).";
  }
  if (!/^[A-Z0-9]{3}$/.test(parsed.locationKey)) {
    return "code location segment must be 3 letters or digits.";
  }
  if (!isValidFacilityFunctionCode(parsed.functionCode)) {
    return "code function suffix must be 3 letters or digits.";
  }
  return null;
}

/**
 * Build an 8-char facility code from a catalog row (UN/LOCODE + optional location key).
 * @param {{ code: string, facilityLocationKey?: string }} location
 */
export function facilityCodeFromCatalogLocation(location) {
  const unloc = normalizeFacilityCode(location?.code ?? "").slice(0, 5);
  if (unloc.length < 5) return "";
  const country = unloc.slice(0, 2);
  const locationKey = String(location?.facilityLocationKey ?? unloc.slice(2, 5))
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 3)
    .padEnd(3, "X");
  return `${country}${locationKey}${FACILITY_PORT_FUNCTION}`;
}

export function suggestFacilityCode({
  country = "",
  name = "",
  city = "",
  locationKey = "",
  functionCode = "WHS",
} = {}) {
  const countryPart = normalizeFacilityCode(country)
    .replace(/[^A-Z]/g, "")
    .slice(0, 2);
  let locPart = normalizeFacilityCode(locationKey).slice(0, 3);
  if (locPart.length < 3) {
    locPart = suggestFacilityLocationKey(name, city);
  }
  const fnPart = normalizeFacilityFunctionCode(functionCode);
  if (countryPart.length < 2 || locPart.length < 3) return "";
  if (!isValidFacilityFunctionCode(fnPart)) return "";
  return `${countryPart}${locPart}${fnPart}`;
}
