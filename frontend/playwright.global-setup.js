import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(frontendDir, "../backend");

export default async function globalSetup() {
  execSync("npm run seed:flows", {
    cwd: backendDir,
    stdio: "inherit",
    env: process.env,
  });
}
