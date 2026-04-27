import { test, expect, type Locator, type Page } from "@playwright/test";

interface MockQuote {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function createQuotes(count: number): MockQuote[] {
  const startTime = Date.UTC(2024, 0, 2);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(startTime);
    date.setUTCDate(date.getUTCDate() + index);
    const base = 100 + index * 0.35;
    return {
      date: date.toISOString(),
      open: base,
      high: base + 2,
      low: base - 2,
      close: base + Math.sin(index / 4),
      volume: 1_000_000 + index * 5_000
    };
  });
}

const mockQuotes = createQuotes(90);

const mockListings = [
  {
    name: "Exponential Moving Average",
    uiid: "EMA",
    legendTemplate: "EMA([P1])",
    endpoint: "ema",
    category: "moving-average",
    chartType: "overlay",
    order: 1,
    chartConfig: null,
    parameters: [
      {
        displayName: "Lookback periods",
        paramName: "lookbackPeriods",
        dataType: "int",
        defaultValue: 20,
        minimum: 2,
        maximum: 250
      }
    ],
    results: [
      {
        displayName: "EMA",
        tooltipTemplate: "EMA: $VALUE",
        dataName: "ema",
        dataType: "number",
        lineType: "solid",
        stack: "",
        lineWidth: 2,
        defaultColor: "#2563eb",
        order: 1
      }
    ]
  },
  {
    name: "Relative Strength Index",
    uiid: "RSI",
    legendTemplate: "RSI([P1])",
    endpoint: "rsi",
    category: "oscillator",
    chartType: "oscillator",
    order: 2,
    chartConfig: {
      minimumYAxis: 0,
      maximumYAxis: 100,
      thresholds: [
        { value: 70, color: "#dc2626", style: "dash", fill: null },
        { value: 30, color: "#16a34a", style: "dash", fill: null }
      ]
    },
    parameters: [
      {
        displayName: "Lookback periods",
        paramName: "lookbackPeriods",
        dataType: "int",
        defaultValue: 14,
        minimum: 2,
        maximum: 250
      }
    ],
    results: [
      {
        displayName: "RSI",
        tooltipTemplate: "RSI: $VALUE",
        dataName: "rsi",
        dataType: "number",
        lineType: "solid",
        stack: "",
        lineWidth: 2,
        defaultColor: "#8b5cf6",
        order: 1
      }
    ]
  }
];

async function mockChartApi(page: Page): Promise<void> {
  await page.route("https://localhost:5001/quotes", route =>
    route.fulfill({ json: mockQuotes, headers: { "access-control-allow-origin": "*" } })
  );
  await page.route("https://localhost:5001/indicators", route =>
    route.fulfill({ json: mockListings, headers: { "access-control-allow-origin": "*" } })
  );
  await page.route("https://localhost:5001/ema**", route =>
    route.fulfill({
      json: mockQuotes.map((quote, index) => ({
        date: quote.date,
        candle: quote,
        ema: quote.close - 1 + index / 200
      })),
      headers: { "access-control-allow-origin": "*" }
    })
  );
  await page.route("https://localhost:5001/rsi**", route =>
    route.fulfill({
      json: mockQuotes.map((quote, index) => ({
        date: quote.date,
        candle: quote,
        rsi: 45 + Math.sin(index / 5) * 20
      })),
      headers: { "access-control-allow-origin": "*" }
    })
  );
}

async function expectCanvasToBeNonBlank(canvas: Locator): Promise<void> {
  await expect(canvas).toBeVisible({ timeout: 20000 });
  await expect
    .poll(
      async () =>
        canvas.evaluate(element => {
          const target = element as HTMLCanvasElement;
          const context = target.getContext("2d");
          if (!context || target.width === 0 || target.height === 0) return false;

          const pixels = context.getImageData(0, 0, target.width, target.height).data;
          let visiblePixels = 0;
          for (let index = 0; index < pixels.length; index += 16) {
            const alpha = pixels[index + 3];
            const darkestChannel = Math.min(pixels[index], pixels[index + 1], pixels[index + 2]);
            visiblePixels += Number(alpha > 0 && darkestChannel < 245);
          }
          return visiblePixels > 20;
        }),
      { timeout: 20000 }
    )
    .toBe(true);
}

test.describe("VitePress Documentation Site", () => {
  test("home page loads with correct title and heading", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Indy Charts Demo");
    await expect(page.getByRole("heading", { name: "Indy Charts", level: 1 })).toBeVisible();
  });

  test("home page shows hero description and CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Financial Charting Made Simple")).toBeVisible();
    await expect(page.getByRole("link", { name: "Get Started" })).toBeVisible();
    await expect(page.getByRole("link", { name: "View Examples" })).toBeVisible();
  });

  test("home page shows all feature cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Financial Charts", level: 2 })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Technical Indicators", level: 2 })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Theme Support", level: 2 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Framework Agnostic", level: 2 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "TypeScript", level: 2 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Performance", level: 2 })).toBeVisible();
  });

  test("navigation links are present", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main Navigation" });
    await expect(nav.getByRole("link", { name: "Home", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Guide", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Examples", exact: true })).toBeVisible();
  });

  test("Guide navigation link works", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Main Navigation" })
      .getByRole("link", { name: "Guide" })
      .click();
    await expect(page).toHaveURL(/\/guide\//);
  });

  test("Examples navigation link works", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Main Navigation" })
      .getByRole("link", { name: "Examples" })
      .click();
    await expect(page).toHaveURL(/\/examples\//);
  });

  test("dark mode toggle is visible and interactive", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator(".VPNavBarAppearance button[role='switch']").first();
    await expect(toggle).toBeVisible();

    const before = await toggle.getAttribute("aria-checked");
    expect(before, "toggle should have aria-checked before click").not.toBeNull();
    await toggle.click();
    await expect(toggle).not.toHaveAttribute("aria-checked", before!);
  });

  test("quick example code block is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Quick Example" })).toBeVisible();
    await expect(page.locator("code").first()).toBeVisible();
  });

  test("installation section shows package manager tabs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Installation" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "npm", exact: true })).toBeChecked();
    await expect(page.getByRole("radio", { name: "pnpm", exact: true })).toBeVisible();
    await expect(page.getByRole("radio", { name: "yarn", exact: true })).toBeVisible();
  });

  test("basic example page renders a nonblank overlay chart", async ({ page }) => {
    await mockChartApi(page);
    await page.goto("/examples/");
    const root = page.getByTestId("stock-indicator-chart-ema-root");
    await expect(root).toBeVisible();
    await expect(page.getByTestId("stock-indicator-chart-ema-error")).toHaveCount(0);
    await expectCanvasToBeNonBlank(page.getByTestId("stock-indicator-chart-ema-overlay-canvas"));
  });

  test("indicators page renders nonblank overlay and oscillator charts", async ({ page }) => {
    await mockChartApi(page);
    await page.goto("/examples/indicators");
    const root = page.getByTestId("stock-indicator-chart-rsi-root");
    await expect(root).toBeVisible();

    await expect(page.getByTestId("stock-indicator-chart-rsi-error")).toHaveCount(0);
    await expectCanvasToBeNonBlank(page.getByTestId("stock-indicator-chart-rsi-overlay-canvas"));
    await expectCanvasToBeNonBlank(page.getByTestId("stock-indicator-chart-rsi-oscillator-canvas"));
  });
});
