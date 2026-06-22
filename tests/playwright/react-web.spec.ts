import { test, expect } from "./fixtures";

/**
 * End-to-end coverage for the React (Vite) frontend migration. Runs under the
 * `react-web` Playwright project (see playwright.config.ts), which serves the
 * `@stock-charts/web` dev server on port 4280 in development mode. No backend is
 * required: the app falls back to bundled backup quotes/indicators and, in
 * non-production mode, still renders the chart from that backup data.
 *
 * Mirrors the chart-rendering checks in `website.spec.ts` (the Angular E2E) and
 * adds React-specific UI flows: the settings dialog and the theme toggle.
 */
test.describe("Stock Charts React Web", () => {
  test.describe.configure({ timeout: 30_000 });

  test("chart page loads and renders the overlay canvas", async ({ page, errorCollection }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // React app mounts into #root.
    await expect(page.locator("#root")).toBeVisible();

    // The main overlay chart canvas should render with a real size.
    const chartCanvas = page.locator("#chartOverlay");
    await expect(chartCanvas).toBeVisible({ timeout: 15_000 });

    const box = await chartCanvas.boundingBox();
    expect(box, "Chart canvas should have a bounding box").not.toBeNull();
    expect(box!.width, "Chart canvas width should be substantial").toBeGreaterThan(100);
    expect(box!.height, "Chart canvas height should be substantial").toBeGreaterThan(50);

    expect(errorCollection.pageErrors, "No uncaught page errors should occur").toEqual([]);
  });

  test("chart canvas paints content (not blank)", async ({ page, errorCollection }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const chartCanvas = page.locator("#chartOverlay");
    await expect(chartCanvas).toBeVisible({ timeout: 15_000 });

    // Wait until the canvas has at least one painted (non-transparent) pixel.
    await page.waitForFunction(
      () => {
        const canvas = document.getElementById("chartOverlay") as HTMLCanvasElement | null;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return false;
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] > 0) return true;
        }
        return false;
      },
      { timeout: 15_000 }
    );

    expect(errorCollection.pageErrors, "No uncaught page errors should occur").toEqual([]);
  });

  test("settings FAB opens the settings dialog", async ({ page, errorCollection }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // The FAB only renders once loading completes and there is no API error.
    await expect(page.locator("#chartOverlay")).toBeVisible({ timeout: 15_000 });

    const fab = page.getByRole("button", { name: "edit settings" });
    await expect(fab).toBeVisible({ timeout: 15_000 });
    await fab.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Chart settings");

    expect(errorCollection.pageErrors, "No uncaught page errors should occur").toEqual([]);
  });

  test("theme toggle flips the body theme class", async ({ page, errorCollection }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#chartOverlay")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "edit settings" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const themeToggle = page.getByRole("checkbox", { name: "Dark theme" });
    const wasDark = await themeToggle.isChecked();

    // The input is part of a custom switch; force the click so a covering label
    // doesn't intercept it. A real click still toggles the checkbox + fires onChange.
    await themeToggle.click({ force: true });

    const expectedClass = wasDark ? "light-theme" : "dark-theme";
    await expect(page.locator("body")).toHaveClass(new RegExp(expectedClass));
    expect(await themeToggle.isChecked()).toBe(!wasDark);

    expect(errorCollection.pageErrors, "No uncaught page errors should occur").toEqual([]);
  });

  test("no critical console errors during chart load", async ({ page, errorCollection }) => {
    const consoleErrors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#chartOverlay")).toBeVisible({ timeout: 15_000 });

    // Backend is intentionally absent in E2E; connection failures are expected
    // and handled by the backup-data fallback.
    const criticalErrors = consoleErrors.filter(
      msg =>
        !msg.includes("favicon") &&
        !msg.includes("ERR_CONNECTION_REFUSED") &&
        !msg.includes("Failed to load resource")
    );

    expect(errorCollection.pageErrors, "No uncaught page errors").toEqual([]);
    expect(criticalErrors, "No critical console errors should occur").toEqual([]);
  });
});
