import { test, expect } from "@playwright/test";

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
    await toggle.click();
    await expect(toggle).not.toHaveAttribute("aria-checked", before ?? "");
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

  test("basic example page renders a demo state (chart or error)", async ({ page }) => {
    await page.goto("/examples/");
    const root = page.getByTestId("indy-overlay-demo");
    await expect(root).toBeVisible();
    await expect(
      page
        .getByTestId("indy-overlay-demo-canvas")
        .or(page.getByTestId("indy-overlay-demo-error"))
        .filter({ visible: true })
    ).toBeVisible({ timeout: 15000 });
  });

  test("indicators page renders a demo state (charts or error)", async ({ page }) => {
    await page.goto("/examples/indicators");
    const root = page.getByTestId("indy-indicators-demo");
    await expect(root).toBeVisible();

    await expect(
      page
        .getByTestId("indy-indicators-demo-overlay-canvas")
        .or(page.getByTestId("indy-indicators-demo-error"))
        .filter({ visible: true })
    ).toBeVisible({ timeout: 20000 });
  });
});
