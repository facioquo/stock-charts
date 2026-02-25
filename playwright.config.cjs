// Root-level stub for the Playwright MCP browser tools.
// The actual E2E test configuration lives in tests/playwright/playwright.config.ts.
// Run E2E tests via: pnpm --filter @stock-charts/playwright-tests run test
//
// NOTE: This file uses .cjs (CommonJS) extension instead of .ts to avoid the
// ESM frozen module namespace issue. The workspace root has "type":"module" so
// .ts files are loaded as ESM by dynamic import(), returning a sealed module
// namespace on which Playwright cannot set its internal `metadata` property.
// A .cjs file is always loaded via require() which returns extensible objects.
module.exports = {
  testDir: "tests/playwright",
  use: {
    baseURL: "http://localhost:5173"
  }
};
