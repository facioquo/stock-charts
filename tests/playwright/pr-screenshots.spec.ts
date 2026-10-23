import { join } from "node:path";

import { test, expect, type Page } from "@playwright/test";

/**
 * Captures each scene for the pull request screenshot standard ("Pull request
 * screenshots" in @facioquo/react-ui's `llms.txt`): one PNG per scene, named
 * `<scene>.png`. The live API is refused, so every scene renders from the
 * bundled snapshot, and the clock is held still, so the same code always draws
 * the same pixels. `.github/workflows/pr-screenshots.yml` compares them with
 * main's and shows the changed ones in the pull request description.
 *
 * Runs only as the `pr-screenshots` project, which playwright.config.ts adds
 * when PR_SCREENSHOTS names the output directory.
 */

const OUT = process.env["PR_SCREENSHOTS"] ?? "test-results/pr-screenshots";

/** The moment every scene renders at. */
const NOW = new Date("2026-10-21T15:00:00Z");

/**
 * Waits until every chart canvas has painted the same pixels, in the same
 * place, for half a second: the charts paint, then lay out and repaint once
 * the oscillators have sized, and a capture between the two would differ from
 * run to run.
 */
async function chartSettled(page: Page): Promise<void> {
  // Each call measures its own half second, so one made right after a resize
  // cannot return on a frame recorded before it.
  await page.evaluate(() => {
    delete (window as unknown as { settled?: unknown }).settled;
  });
  await page.waitForFunction(
    () => {
      const canvases = [...document.querySelectorAll("canvas")];
      const frame = canvases.map(canvas => {
        const { top, left } = canvas.getBoundingClientRect();
        const data = canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height).data;
        let sum = 0;
        data?.forEach((value, i) => (sum = (sum + value * (i + 1)) % 2_147_483_647));
        return `${top},${left},${canvas.width}x${canvas.height},${sum}`;
      });
      const painted = canvases.length > 1 && !frame.some(entry => entry.endsWith(",0"));
      const state = window as unknown as { settled?: { frame: string; since: number } };
      const key = frame.join(";");
      if (!painted || state.settled?.frame !== key) {
        state.settled = { frame: key, since: performance.now() };
        return false;
      }
      return performance.now() - state.settled.since >= 500;
    },
    undefined,
    { polling: 100, timeout: 15_000 }
  );
}

/**
 * Makes every chart draw again once the page's web fonts are ready, in a
 * viewport as tall as the page, and waits for it to settle. Chart.js measures
 * its labels when it draws, so a chart drawn while a font was still arriving
 * keeps the wrong metrics until the next draw, which a resize forces. A
 * full-page screenshot would resize the viewport itself and catch the charts
 * mid-redraw, so the viewport takes the page's height here instead.
 */
async function redrawWithFonts(page: Page): Promise<void> {
  // A canvas does not ask for a web font the way the page's text does, so the
  // charts' face is loaded by name; document.fonts.ready covers the rest.
  await page.evaluate(async () => {
    await document.fonts.load("400 12px Roboto", "MACD(12,26,9) $760");
    await document.fonts.ready;
  });
  const { width } = page.viewportSize()!;
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: width - 1, height });
  await chartSettled(page);
  await page.setViewportSize({ width, height });
  await chartSettled(page);
}

/** Every scene, by the name its PNG takes, and how to reach it from the chart. */
const SCENES: { name: string; open?: (page: Page) => Promise<void> }[] = [
  { name: "chart" },
  {
    name: "chart-settings",
    open: async page => {
      await page.getByRole("button", { name: "edit settings" }).click();
      await expect(page.getByRole("dialog")).toContainText("Chart settings");
    }
  },
  {
    name: "indicator-settings",
    open: async page => {
      await page.getByRole("button", { name: "edit settings" }).click();
      await page.getByRole("button", { name: /^edit RSI/ }).click();
      await expect(page.getByLabel("Lookback Periods")).toBeVisible();
    }
  }
];

test.describe("PR screenshots", () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(NOW);
    // The dev build reads https://localhost:5001 first; refusing it sends every
    // read to the snapshot without waiting on a connection that never comes.
    await page.route("https://localhost:5001/**", route => route.abort());
  });

  for (const { name, open } of SCENES) {
    test(name, async ({ page }) => {
      await page.goto("/");
      await expect(page.getByText("Showing saved data")).toBeVisible({ timeout: 15_000 });
      await chartSettled(page);
      await redrawWithFonts(page);
      // Opening a dialog can load another font and redraw the charts behind it.
      await open?.(page);
      await redrawWithFonts(page);
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: join(OUT, `${name}.png`),
        animations: "disabled",
        caret: "hide"
      });
    });
  }
});
