import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";

const WEBSITE_URL = "http://localhost:4200";

/**
 * Collects console errors and page errors for debugging chart issues.
 */
function collectErrors(page: Page): { consoleErrors: string[]; pageErrors: string[] } {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  page.on("pageerror", (error: Error) => {
    pageErrors.push(`${error.name}: ${error.message}`);
  });

  return { consoleErrors, pageErrors };
}

test.describe("Stock Charts Angular Website", () => {
  test.describe.configure({ timeout: 30_000 });

  test("home page loads and navigates to chart page", async ({ page }) => {
    const { pageErrors } = collectErrors(page);

    await page.goto(WEBSITE_URL);
    await page.waitForLoadState("networkidle");

    // The app should be visible
    const appRoot = page.locator("app-root");
    await expect(appRoot).toBeVisible();

    // Report any JS errors
    expect(pageErrors, "No page errors should occur on load").toEqual([]);
  });

  test("main overlay chart canvas renders", async ({ page }) => {
    const { pageErrors } = collectErrors(page);

    await page.goto(WEBSITE_URL);
    await page.waitForLoadState("networkidle");

    // Wait for the chart overlay canvas to appear
    const chartCanvas = page.locator("#chartOverlay");
    await expect(chartCanvas).toBeVisible({ timeout: 15_000 });

    // Verify the canvas has non-zero dimensions (chart actually rendered)
    const box = await chartCanvas.boundingBox();
    expect(box, "Chart canvas should have a bounding box").not.toBeNull();
    expect(box!.width, "Chart canvas width should be positive").toBeGreaterThan(0);
    expect(box!.height, "Chart canvas height should be positive").toBeGreaterThan(0);

    // Chart should have substantial size (not collapsed)
    expect(box!.width).toBeGreaterThan(100);
    expect(box!.height).toBeGreaterThan(50);

    // Report any JS errors
    expect(pageErrors, "No page errors should occur during chart rendering").toEqual([]);
  });

  test("chart loads with correct bar count logged", async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on("console", (msg: ConsoleMessage) => {
      consoleLogs.push(msg.text());
    });

    await page.goto(WEBSITE_URL);
    await page.waitForLoadState("networkidle");

    // Wait for chart canvas to confirm loading completed
    await expect(page.locator("#chartOverlay")).toBeVisible({ timeout: 15_000 });

    // Check that the "Loading charts with X bars" message was logged
    const loadingMsg = consoleLogs.find(msg => msg.includes("Loading charts with"));
    expect(loadingMsg, "Should log bar count during chart loading").toBeDefined();

    // Extract bar count and verify it's within the expected range (20-500)
    const match = loadingMsg!.match(/Loading charts with (\d+) bars/);
    expect(match, "Should contain numeric bar count").not.toBeNull();
    const barCount = parseInt(match![1], 10);
    expect(barCount, "Bar count should be at least 20").toBeGreaterThanOrEqual(20);
    expect(barCount, "Bar count should be at most 500").toBeLessThanOrEqual(500);
  });

  test("chart canvas has painted content (not blank)", async ({ page }) => {
    const { pageErrors } = collectErrors(page);

    await page.goto(WEBSITE_URL);
    await page.waitForLoadState("networkidle");

    // Wait for chart to render
    const chartCanvas = page.locator("#chartOverlay");
    await expect(chartCanvas).toBeVisible({ timeout: 15_000 });

    // Wait a bit for Chart.js rendering to complete
    await page.waitForTimeout(2000);

    // Check if the canvas has non-blank content by evaluating pixel data
    const hasContent = await page.evaluate(() => {
      const canvas = document.getElementById("chartOverlay") as HTMLCanvasElement | null;
      if (!canvas) return false;
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // Check if any pixel has non-zero alpha (meaning something was drawn)
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) return true;
      }
      return false;
    });

    expect(hasContent, "Chart canvas should have painted content (not blank)").toBe(true);
    expect(pageErrors, "No page errors should occur").toEqual([]);
  });

  test("oscillator charts render in oscillators zone", async ({ page }) => {
    const { pageErrors } = collectErrors(page);

    await page.goto(WEBSITE_URL);
    await page.waitForLoadState("networkidle");

    // Wait for main chart to load
    await expect(page.locator("#chartOverlay")).toBeVisible({ timeout: 15_000 });

    // Wait for default indicator selections to load (they render as canvas elements
    // inside the #oscillators-zone div, which is populated dynamically)
    const oscillatorsZone = page.locator("#oscillators-zone");
    await expect(oscillatorsZone).toBeVisible();

    // Wait for oscillator canvases to appear (default selections load async)
    const oscillatorCanvases = oscillatorsZone.locator("canvas");
    await expect(oscillatorCanvases.first()).toBeVisible({ timeout: 15_000 });

    // Verify at least one oscillator rendered
    const count = await oscillatorCanvases.count();
    expect(count, "At least one oscillator chart should render").toBeGreaterThan(0);

    expect(pageErrors, "No page errors should occur").toEqual([]);
  });

  test("no critical console errors during full page lifecycle", async ({ page }) => {
    const { consoleErrors, pageErrors } = collectErrors(page);

    await page.goto(WEBSITE_URL);
    await page.waitForLoadState("networkidle");

    // Wait for everything to load
    await expect(page.locator("#chartOverlay")).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(5000);

    // Filter out known acceptable warnings (e.g., CORS in dev, etc.)
    const criticalErrors = consoleErrors.filter(
      msg =>
        !msg.includes("favicon") &&
        !msg.includes("service-worker") &&
        !msg.includes("ngsw") &&
        !msg.includes("CORS")
    );

    // Page errors are always critical
    expect(pageErrors, "No uncaught page errors").toEqual([]);

    // Console errors should be minimal
    expect(criticalErrors, "No critical console errors should occur").toEqual([]);
  });
});
