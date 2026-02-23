import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/playwright",
  use: {
    baseURL: "http://localhost:4173"
  },
  webServer: {
    command:
      "pnpm --filter @stock-charts/vitepress-example run build && pnpm --filter @stock-charts/vitepress-example run preview",
    port: 4173,
    timeout: 120_000,
    reuseExistingServer: true
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
