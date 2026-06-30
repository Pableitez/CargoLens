import { expect, test } from "@playwright/test";

const DEMO_EMAIL = "demo@naolab.local";
const DEMO_PASSWORD = "FreightDemo2026!";
const DEMO_SB_REF = "SB-DEMO-2026-001";
const DEMO_CB_DRAFT_REF = "CB-DEMO-2026-001";

async function loginAsDemoStaff(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.locator("#login-email").fill(DEMO_EMAIL);
  await page.locator("#login-password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await page
    .getByRole("button", { name: "Got it" })
    .click({ timeout: 2_000 })
    .catch(() => {});
}

test.describe("Carrier booking SB → CB → submit", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoStaff(page);
  });

  test("submits demo draft carrier booking via mock INTTRA", async ({ page }) => {
    await page.goto("/dashboard/operations/transport/carrier-booking");
    await page.getByRole("link", { name: DEMO_CB_DRAFT_REF }).click();
    await expect(page.getByRole("button", { name: "Submit to INTTRA" })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: "Submit to INTTRA" }).click();
    await expect(page.locator(".order-status--acknowledged")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("dd").filter({ hasText: /^MOCK-INTTRA-/ })).toBeVisible();
  });

  test("creates a carrier booking from shipper booking and submits via mock INTTRA", async ({ page }) => {
    await page.goto("/dashboard/operations/export/shipper-booking");
    await expect(page.getByRole("link", { name: DEMO_SB_REF })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("link", { name: DEMO_SB_REF }).click();

    await page
      .getByRole("link", { name: /Request carrier booking \(CB\)/i })
      .first()
      .click();
    await expect(page).toHaveURL(/carrier-booking\/new\/from-sb/);

    await expect(page.getByRole("button", { name: "Save as draft" })).toBeEnabled({
      timeout: 30_000,
    });
    await page.getByRole("button", { name: "Save as draft" }).click();

    await expect(page).toHaveURL(/carrier-booking\/(?!new)/, { timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Submit to INTTRA" })).toBeVisible();

    await page.getByRole("button", { name: "Submit to INTTRA" }).click();

    await expect(page.locator(".order-status--acknowledged")).toBeVisible({ timeout: 20_000 });
  });
});
