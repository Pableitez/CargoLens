import { test, expect } from "@playwright/test";

test.describe("public app", () => {
  test("home page loads and shows brand", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("marketing home shows hero and primary CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Start free workspace|Crear espacio gratis/i })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Sign in|Iniciar sesión/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Try container visibility|Probar visibilidad/i })
    ).toBeVisible();
  });
});
