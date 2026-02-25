// Root-level stub for the Playwright MCP browser tools.
// The actual E2E test configuration lives in tests/playwright/playwright.config.ts.
// Run E2E tests via: pnpm --filter @stock-charts/playwright-tests run test
//
// NOTE: This config uses export default with a plain object literal. The workspace
// root has "type":"module" so .ts files are loaded as ESM. Playwright's loadUserConfig
// does `if ("default" in object) object = object["default"]` to extract the default
// property from the module namespace, yielding a plain extensible object.

export default {
  testDir: "tests/playwright",
  use: {
    baseURL: "http://localhost:5173"
  }
};
