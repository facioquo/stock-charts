import path from "path";
import { fileURLToPath } from "url";

import { defineConfig, devices } from "@playwright/test";

// ESM doesn't define `__dirname`; derive it from import.meta.url.
const here = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(here, "../..");

/**
 * Where pull request screenshot scenes are written. When set, only the
 * `pr-screenshots` project runs, against the React site alone (see
 * pr-screenshots.spec.ts and .github/workflows/pr-screenshots.yml).
 */
const screenshots = process.env["PR_SCREENSHOTS"];

const reactSite = {
  // React (Vite) website. Build indy-charts first so the dev server can
  // resolve @facioquo/indy-charts before Playwright connects.
  command: "pnpm --filter @facioquo/indy-charts run build && pnpm run serve",
  url: "http://localhost:4200",
  cwd: workspaceRoot,
  reuseExistingServer: !process.env["CI"],
  timeout: 180_000
};

export default defineConfig({
  testDir: ".",
  testMatch: ["**/*.spec.ts"],
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in source code. */
  forbidOnly: !!process.env["CI"],
  /* Retry on CI only */
  retries: process.env["CI"] ? 2 : 0,
  /* Opt out of parallel tests on CI */
  workers: process.env["CI"] ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/results.json" }]
  ],
  /* Shared settings for all projects. */
  use: {
    headless: true,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry"
  },
  /* Start servers automatically; reuseExistingServer allows a locally running
   * server to be reused during development, while CI always starts fresh. */
  webServer: screenshots
    ? [reactSite]
    : [
        reactSite,
        {
          command:
            "pnpm --filter @stock-charts/vitepress-example run build:libs && pnpm --filter @stock-charts/vitepress-example run build && pnpm --filter @stock-charts/vitepress-example run preview:test",
          url: "http://localhost:4302",
          cwd: workspaceRoot,
          reuseExistingServer: !process.env["CI"],
          timeout: 180_000
        }
      ],
  projects: screenshots
    ? [
        {
          name: "pr-screenshots",
          testMatch: ["pr-screenshots.spec.ts"],
          // A scene that needs a retry is not deterministic; fail it instead.
          retries: 0,
          use: {
            ...devices["Desktop Chrome"],
            baseURL: "http://localhost:4200",
            viewport: { width: 1280, height: 800 },
            locale: "en-US",
            timezoneId: "UTC",
            colorScheme: "light",
            reducedMotion: "reduce",
            // Software raster on one thread, without hinting or subpixel text,
            // so every run paints the same pixels.
            launchOptions: {
              args: [
                "--disable-partial-raster",
                "--disable-gpu",
                "--font-render-hinting=none",
                "--disable-lcd-text",
                "--force-color-profile=srgb",
                "--num-raster-threads=1"
              ]
            }
          }
        }
      ]
    : [
        {
          name: "website",
          testMatch: ["react-web.spec.ts", "seed.spec.ts"],
          use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:4200" }
        },
        {
          name: "vitepress",
          testMatch: ["vitepress.spec.ts"],
          use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:4302" }
        }
      ]
});
