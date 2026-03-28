import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
  },
  /** Run `npm run dev` first, or set PLAYWRIGHT_BASE_URL. CI can inject webServer via env. */
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
