import { test as base, type Page } from "@playwright/test";

interface ErrorCollection {
  consoleErrors: string[];
  pageErrors: string[];
}

/**
 * Custom fixture that collects console errors and page errors during a test.
 * Replaces manual error collection with Playwright's native fixture pattern.
 */
export const test = base.extend<{ errorCollection: ErrorCollection }>({
  errorCollection: async ({ page }, use) => {
    const errors: ErrorCollection = {
      consoleErrors: [],
      pageErrors: []
    };

    // Capture console errors
    page.on("console", msg => {
      if (msg.type() === "error") {
        errors.consoleErrors.push(msg.text());
      }
    });

    // Capture page errors
    page.on("pageerror", error => {
      errors.pageErrors.push(`${error.name}: ${error.message}`);
    });

    await use(errors);
  }
});

export { expect } from "@playwright/test";
export type { Page } from "@playwright/test";
