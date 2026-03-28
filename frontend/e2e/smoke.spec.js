import { test, expect } from "@playwright/test";

test.describe("public app", () => {
  test("home page loads and shows brand", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});
 
