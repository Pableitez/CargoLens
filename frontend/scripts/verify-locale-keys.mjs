/**
 * Ensures en and es locale trees have the same dot-path keys (values may differ).
 * Run: node scripts/verify-locale-keys.mjs
 */
import path from "path";
import { fileURLToPath } from "url";
import { pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "../src/i18n/locales");

function flattenKeys(obj, prefix = "") {
  const keys = [];
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    keys.push(prefix || "(root)");
    return keys;
  }
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, p));
    } else {
      keys.push(p);
    }
  }
  return keys;
}

async function main() {
  const en = (await import(pathToFileURL(path.join(localesDir, "en.js")).href)).default;
  const es = (await import(pathToFileURL(path.join(localesDir, "es.js")).href)).default;

  const enKeys = new Set(flattenKeys(en));
  const esKeys = new Set(flattenKeys(es));

  const missingInEs = [...enKeys].filter((k) => !esKeys.has(k)).sort();
  const missingInEn = [...esKeys].filter((k) => !enKeys.has(k)).sort();

  if (missingInEs.length || missingInEn.length) {
    console.error("Locale key mismatch:");
    if (missingInEs.length) {
      console.error("  Missing in es:", missingInEs.join(", "));
    }
    if (missingInEn.length) {
      console.error("  Missing in en:", missingInEn.join(", "));
    }
    process.exit(1);
  }
  console.log(`OK: ${enKeys.size} keys match between en and es.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
