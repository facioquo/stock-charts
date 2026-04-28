// Root-level stub for the Playwright MCP browser tools.
// The actual E2E test configuration lives in tests/playwright/playwright.config.ts.
// Run E2E tests via: pnpm --filter @stock-charts/playwright-tests run test
//
// NOTE: This config intentionally uses `export default` with a plain object literal
// rather than `defineConfig()`. The workspace root has "type":"module", so .ts files
// are loaded as ESM. Playwright's loadUserConfig extracts the `default` property,
// yielding a plain extensible object (required for Playwright to set `metadata`).
// `@playwright/test` is also not installed at root — it lives in tests/playwright/.

export default {
  testDir: "tests/playwright",
  use: {
    baseURL: process.env["PLAYWRIGHT_TEST_BASE_URL"] ?? "http://localhost:4200",
    headless: true,
    trace: "on-first-retry"
  }
};
