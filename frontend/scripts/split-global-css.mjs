/**
 * One-time splitter: global.css → modular styles/
 * Run: node scripts/split-global-css.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stylesDir = path.resolve(__dirname, "../src/styles");
const srcPath = path.join(stylesDir, "global.css");
const backupPath = path.join(stylesDir, "global.css.bak");

/** @type {[string, number, number][]} 1-based inclusive line ranges */
const CHUNKS = [
  ["tokens/fonts.css", 1, 1],
  ["tokens/theme.css", 3, 175],
  ["base/focus.css", 177, 215],
  ["components/buttons.css", 217, 316],
  ["components/forms.css", 318, 391],
  ["components/alerts.css", 393, 412],
  ["layout/core.css", 414, 1050],
  ["shell/nav.css", 1051, 1188],
  ["dashboard/stats.css", 1190, 1245],
  ["dashboard/overview-snapshot.css", 1246, 1543],
  ["dashboard/overview-summary.css", 1544, 2678],
  ["marketing/public-pages.css", 2679, 5039],
  ["tracking/results.css", 5040, 5535],
  ["shell/app-shell.css", 5536, 6428],
  ["ux/feedback.css", 6429, 6927],
  ["ux/overlays.css", 6928, 7565],
];

function extractLines(allLines, start, end) {
  return allLines.slice(start - 1, end).join("\n").trimEnd() + "\n";
}

const raw = fs.readFileSync(srcPath, "utf8");
const lines = raw.split("\n");

if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(srcPath, backupPath);
}

for (const [rel, start, end] of CHUNKS) {
  const outPath = path.join(stylesDir, rel);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, extractLines(lines, start, end), "utf8");
}

// workspace-nav lives inside shell/nav.css (lines 1176–1188)

const IMPORTS = [
  "./tokens/fonts.css",
  "./tokens/theme.css",
  "./base/focus.css",
  "./components/buttons.css",
  "./components/forms.css",
  "./components/alerts.css",
  "./layout/core.css",
  "./shell/nav.css",
  "./dashboard/stats.css",
  "./dashboard/overview-snapshot.css",
  "./dashboard/overview-summary.css",
  "./marketing/public-pages.css",
  "./tracking/results.css",
  "./shell/app-shell.css",
  "./ux/feedback.css",
  "./ux/overlays.css",
];

const entry = `/* CargoLens — modular styles (import order matters) */\n${IMPORTS.map((p) => `@import "${p}";`).join("\n")}\n`;
fs.writeFileSync(srcPath, entry, "utf8");

console.log("Split global.css into", IMPORTS.length, "modules.");
console.log("Backup:", backupPath);
