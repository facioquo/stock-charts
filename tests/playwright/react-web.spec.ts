import { test, expect, type Page } from "./fixtures";

/**
 * End-to-end coverage for the React (Vite) frontend migration. Runs under the
 * `react-web` Playwright project (see playwright.config.ts), which serves the
 * `@stock-charts/web` dev server on port 4280 in development mode. No backend is
 * required: the app falls back to bundled backup quotes/indicators and, in
 * non-production mode, still renders the chart from that backup data.
 *
 * Covers chart rendering plus the settings dialog and the theme toggle.
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

  test("a displayed indicator is edited in place", async ({ page, errorCollection }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#chartOverlay")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "edit settings" }).click();
    const displayed = page.locator(".displayed-indicators .selection-list li");
    await expect(displayed.first()).toBeVisible();
    const before = await displayed.count();

    await page.getByRole("button", { name: /^edit RSI/ }).click();
    const lookback = page.getByLabel("Lookback Periods");
    await expect(lookback).toHaveValue("5");
    await lookback.fill("9");
    await page.getByRole("button", { name: "Save" }).click();

    // Saving reopens the settings list: same number of indicators, new parameter.
    await expect(page.getByRole("button", { name: /^edit RSI.*9/ })).toBeVisible({
      timeout: 15_000
    });
    await expect(displayed).toHaveCount(before);

    expect(errorCollection.pageErrors, "No uncaught page errors should occur").toEqual([]);
  });

  test.describe("on a touch screen", () => {
    test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

    test("a finger drag on a handle reorders rather than scrolling", async ({
      page,
      errorCollection
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("#chartOverlay")).toBeVisible({ timeout: 15_000 });

      const oscillators = page.getByRole("list", { name: "Oscillator charts" });
      await page.getByRole("button", { name: "edit settings" }).click();
      await expect(oscillators.locator("li label").first()).toHaveText(/^RSI/);

      const handle = page.getByRole("button", { name: /^reorder ADX/ });
      await handle.scrollIntoViewIfNeeded();
      const from = await handle.boundingBox();
      const firstRow = await oscillators.locator("li").first().boundingBox();
      if (!from || !firstRow) throw new Error("reorder handle or target row is not laid out");
      const body = page.locator(".settings-body");
      const scrollBefore = await body.evaluate(element => element.scrollTop);

      // Playwright's touchscreen only taps, so the drag goes in as raw touch events.
      const cdp = await page.context().newCDPSession(page);
      const x = from.x + from.width / 2;
      const touchAt = (type: string, y: number) =>
        cdp.send("Input.dispatchTouchEvent", {
          type,
          touchPoints: type === "touchEnd" ? [] : [{ x, y }]
        });
      await touchAt("touchStart", from.y + from.height / 2);
      for (let y = from.y + from.height / 2; y > firstRow.y + 4; y -= 6) {
        await touchAt("touchMove", y);
      }
      await touchAt("touchMove", firstRow.y + 4);
      await touchAt("touchEnd", firstRow.y + 4);

      await expect(oscillators.locator("li label").first()).toHaveText(/^ADX/);
      expect(await body.evaluate(element => element.scrollTop)).toBe(scrollBefore);
      await expect(page.getByRole("menu")).toHaveCount(0);

      expect(errorCollection.pageErrors, "No uncaught page errors should occur").toEqual([]);
    });
  });

  test("a reordered indicator keeps its place after a reload", async ({
    page,
    errorCollection
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#chartOverlay")).toBeVisible({ timeout: 15_000 });

    const oscillators = page.getByRole("list", { name: "Oscillator charts" }).locator("li label");
    await page.getByRole("button", { name: "edit settings" }).click();
    await expect(oscillators.first()).toHaveText(/^RSI/);

    // A stepped drag, as a pointer makes: Chrome starts a drag only once the pointer
    // has moved off the handle, which a single jump to the target does not do.
    const handleButton = page.getByRole("button", { name: /^reorder ADX/ });
    await handleButton.scrollIntoViewIfNeeded();
    const handle = await handleButton.boundingBox();
    const firstRow = await page
      .getByRole("list", { name: "Oscillator charts" })
      .locator("li")
      .first()
      .boundingBox();
    if (!handle || !firstRow) throw new Error("reorder handle or target row is not laid out");
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(handle.x + handle.width / 2 + 5, handle.y + 5, { steps: 3 });
    // The upper half of a row drops into the gap above it.
    await page.mouse.move(firstRow.x + 80, firstRow.y + 4, { steps: 10 });
    await page.mouse.up();
    await expect(oscillators.first()).toHaveText(/^ADX/);

    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#chartOverlay")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "edit settings" }).click();
    await expect(oscillators.first()).toHaveText(/^ADX/);

    expect(errorCollection.pageErrors, "No uncaught page errors should occur").toEqual([]);
  });

  test("a copied link restores the configuration in a fresh browser", async ({
    page,
    browser,
    errorCollection
  }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#chartOverlay")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "edit settings" }).click();
    await page.getByRole("button", { name: /^reorder ADX/ }).press("ArrowUp");
    await page.getByRole("button", { name: "copy share link" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Link copied" })).toBeVisible();
    const link = await page.evaluate(() => navigator.clipboard.readText());

    const fresh = await browser.newContext();
    const shared = await fresh.newPage();
    await shared.goto(link);
    await shared.waitForLoadState("networkidle");
    await expect(shared.locator("#chartOverlay")).toBeVisible({ timeout: 15_000 });
    await shared.getByRole("button", { name: "edit settings" }).click();
    const oscillators = shared.locator(".selection-list").nth(1).locator("li label");
    await expect(oscillators.first()).toHaveText(/^ADX/);
    expect(await shared.evaluate(() => localStorage.getItem("selections"))).toBeNull();
    await shared.keyboard.press("Escape");

    // The shared view says so, and one click returns to the visitor's own setup.
    await expect(
      shared.getByRole("status").filter({ hasText: "Showing a shared chart" })
    ).toBeVisible();
    await shared.getByRole("button", { name: "Back to my indicators" }).click();
    await expect(shared.getByText("Showing a shared chart")).toBeHidden({ timeout: 15_000 });
    expect(new URL(shared.url()).searchParams.has("c")).toBe(false);
    await expect(shared.locator("#chartOverlay")).toBeVisible({ timeout: 15_000 });
    // The list is read when the dialog opens, so reopen it until the restore has landed.
    await expect(async () => {
      await shared.getByRole("button", { name: "edit settings" }).click();
      try {
        await expect(oscillators.first()).toHaveText(/^RSI/, { timeout: 2_000 });
      } catch (error) {
        await shared.keyboard.press("Escape");
        throw error;
      }
    }).toPass({ timeout: 30_000 });
    await fresh.close();

    expect(errorCollection.pageErrors, "No uncaught page errors should occur").toEqual([]);
  });

  test("theme toggle flips the body theme class", async ({ page, errorCollection }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#chartOverlay")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "edit settings" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Primer's ToggleSwitch is a button whose pressed state is the setting.
    const themeToggle = page.getByRole("button", { name: "Dark theme" });
    const wasDark = (await themeToggle.getAttribute("aria-pressed")) === "true";

    await themeToggle.click();

    const expectedClass = wasDark ? "light-theme" : "dark-theme";
    await expect(page.locator("body")).toHaveClass(new RegExp(expectedClass));
    await expect(themeToggle).toHaveAttribute("aria-pressed", String(!wasDark));
    // The controls switch to Primer's matching theme with the page.
    await expect(page.locator("[data-color-mode]").first()).toHaveAttribute(
      "data-color-mode",
      wasDark ? "light" : "dark"
    );

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

  test.describe("with the API down", () => {
    test.describe.configure({ timeout: 90_000 });

    interface CatalogListing {
      uiid: string;
      legendTemplate: string;
      chartType: string;
      parameters: Array<{
        paramName: string;
        displayName: string;
        minimum: number;
        maximum: number;
        defaultValue: number;
      }>;
    }

    /**
     * The settings list is read when the dialog opens, so opening it while the
     * saved indicators are still being restored shows a partial list. Reopen it
     * until the restore has landed.
     */
    async function expectDisplayed(page: Page, count: number): Promise<void> {
      const displayed = page.locator(".displayed-indicators .selection-list li");
      await expect(async () => {
        await page.getByRole("button", { name: "edit settings" }).click();
        try {
          await expect(displayed).toHaveCount(count, { timeout: 2_000 });
        } catch (error) {
          await page.keyboard.press("Escape");
          throw error;
        }
      }).toPass({ timeout: 60_000 });
    }

    /** Snapshot requests that did not return a JSON file, and the paths that did. */
    let missing: string[];
    let served: string[];
    /** Snapshot requests sent and not yet finished, so a late response cannot be read around. */
    let inFlight: Set<string>;

    test.beforeEach(async ({ page }) => {
      missing = [];
      served = [];
      inFlight = new Set();
      const isSnapshot = (url: string): boolean => url.includes("/data/chart-api/");
      page.on("request", req => {
        if (isSnapshot(req.url())) inFlight.add(req.url());
      });
      page.on("requestfinished", req => inFlight.delete(req.url()));
      page.on("requestfailed", req => inFlight.delete(req.url()));
      // The configured API origin (local dev) and the production origin that
      // snapshot listings name in their endpoints.
      await page.route(/localhost:5001|charts-api\.stockindicators\.dev/, route => route.abort());
      page.on("response", res => {
        const marker = "/data/chart-api/";
        if (!res.url().includes(marker)) return;
        // A missing file falls through to the dev server's index.html, which is a 200.
        const isJson = (res.headers()["content-type"] ?? "").includes("json");
        if (res.ok() && isJson) served.push(decodeURIComponent(res.url().split(marker)[1]));
        else missing.push(res.url());
      });
    });

    test("a fresh visitor sees the default indicators from the snapshot", async ({
      page,
      errorCollection
    }) => {
      await page.goto("/");
      await expect(page.locator("#chartOverlay")).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole("button", { name: "Live API unreachable" })).toBeVisible({
        timeout: 15_000
      });

      await expectDisplayed(page, 7);
      await expect(page.getByRole("button", { name: /^edit RSI.*5/ })).toBeVisible();

      // Each opening indicator drew rows from its own snapshot file, at its opening parameters.
      await expect.poll(() => inFlight.size).toBe(0);
      expect(served).toEqual(
        expect.arrayContaining(["SLOPE/lookbackPeriods=50.json", "RSI/lookbackPeriods=5.json"])
      );
      expect(missing, "every selection finds its snapshot file").toEqual([]);

      expect(errorCollection.pageErrors, "No uncaught page errors").toEqual([]);
    });

    test("every catalog indicator renders from the snapshot", async ({
      page,
      request,
      baseURL,
      errorCollection
    }) => {
      const response = await request.get(`${baseURL}/data/chart-api/indicators.json`);
      expect(response.ok(), "the committed snapshot lists the catalog").toBe(true);
      const catalog = (await response.json()) as CatalogListing[];
      expect(catalog.length).toBeGreaterThan(0);

      const selections = catalog.map(listing => ({
        ucid: `chart-${listing.uiid}`,
        uiid: listing.uiid,
        label: listing.legendTemplate,
        chartType: listing.chartType,
        params: listing.parameters.map(param => ({
          paramName: param.paramName,
          displayName: param.displayName,
          minimum: param.minimum,
          maximum: param.maximum,
          value: param.defaultValue
        })),
        results: []
      }));
      await page.addInitScript(saved => {
        localStorage.setItem("selections", JSON.stringify(saved));
      }, selections);

      await page.goto("/");
      await expect(page.locator("#chartOverlay")).toBeVisible({ timeout: 15_000 });
      // The snapshot answered, so the notice shows; a run that never went offline fails here.
      await expect(page.getByRole("button", { name: "Live API unreachable" })).toBeVisible({
        timeout: 15_000
      });

      await expectDisplayed(page, catalog.length);
      // Read `missing` only once every snapshot request has finished.
      await expect.poll(() => inFlight.size).toBe(0);
      expect(served.length, "the snapshot answered").toBeGreaterThanOrEqual(catalog.length);
      expect(missing, "every selection finds its snapshot file").toEqual([]);

      expect(errorCollection.pageErrors, "No uncaught page errors").toEqual([]);
    });
  });
});
