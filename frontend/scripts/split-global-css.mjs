/**
 * Legacy one-time splitter: global.css → modular styles/
 * Run only if restoring from global.css.bak — current repo is already modular.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stylesDir = path.resolve(__dirname, "../src/styles");

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
  "./dashboard/orders.css",
  "./dashboard/trade-setup.css",
  "./dashboard/messages.css",
  "./dashboard/modules.css",
  "./dashboard/filter-sidebar.css",
  "./marketing/public-pages.css",
  "./shell/app-shell.css",
  "./ux/feedback.css",
  "./ux/overlays.css",
];

const entry = `/* NaoLab — modular styles (import order matters) */\n${IMPORTS.map((p) => `@import "${p}";`).join("\n")}\n`;
fs.writeFileSync(path.join(stylesDir, "global.css"), entry, "utf8");
console.log("Wrote global.css with", IMPORTS.length, "imports.");
