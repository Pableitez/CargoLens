import { defineConfig, devices } from "@playwright/test";

const apiPort = 4000;
const webPort = 5173;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./playwright.global-setup.js",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  timeout: 90_000,
  use: {
    baseURL: `http://localhost:${webPort}`,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "npm run dev",
      cwd: "../backend",
      url: `http://localhost:${apiPort}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "npm run dev",
      url: `http://localhost:${webPort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
