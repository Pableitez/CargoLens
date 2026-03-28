/**
 * Sonar espera rutas como frontend/src/... y backend/src/...; Jest/Vitest
 * suelen escribir SF:src/... relativo a cada paquete.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function patch(lcovPath, prefix) {
  if (!fs.existsSync(lcovPath)) return;
  let s = fs.readFileSync(lcovPath, "utf8");
  s = s.replace(/^SF:(.+)$/gm, (_, p) => {
    const norm = p.replace(/\\/g, "/");
    if (norm.startsWith(`${prefix}/`)) return `SF:${norm}`;
    return `SF:${prefix}/${norm}`;
  });
  fs.writeFileSync(lcovPath, s);
}

patch(path.join(root, "frontend/coverage/lcov.info"), "frontend");
patch(path.join(root, "backend/coverage/lcov.info"), "backend");
