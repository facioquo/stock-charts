import { test, expect } from "./fixtures";

test("seed", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Stock Indicators/);
});
