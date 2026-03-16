import { expect, test } from "@playwright/test";

test("seed", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Stock Indicators/);
});
