import { test } from "@playwright/test";

const BASE = "http://localhost:5173";

test("seed", async ({ page }) => {
  await page.goto(BASE);
});
