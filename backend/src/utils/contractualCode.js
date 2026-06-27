import { BE_CODE_FUNCTION_CODES, suggestBeCode } from "../../../shared/domain/beCode.js";

/** Fallback BE code when creating contractual parties without an explicit code. */
export function contractualCodeFromName(name, { country = "", functionCode = "HQ" } = {}) {
  const suggested = suggestBeCode({ country, legalName: name, functionCode });
  if (suggested) return suggested;
  return suggestBeCode({ country: "XX", legalName: name || "CLIENT", functionCode: "HQ" }) || "XXCLIENTHQ";
}

export function contractualCodeAlternatives(name, { country = "" } = {}) {
  const seen = new Set();
  const codes = [];
  for (const functionCode of BE_CODE_FUNCTION_CODES) {
    const code = suggestBeCode({ country, legalName: name, functionCode });
    if (code && !seen.has(code)) {
      seen.add(code);
      codes.push(code);
    }
  }
  if (codes.length === 0) {
    codes.push(contractualCodeFromName(name, { country }));
  }
  return codes;
}
