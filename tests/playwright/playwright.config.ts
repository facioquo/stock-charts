import path from "path";

import { defineConfig, devices } from "@playwright/test";

const workspaceRoot = path.resolve(__dirname, "../..");

export default defineConfig({
  testDir: ".",
  testMatch: ["**/*.spec.ts"],
  reporter: [["list"], ["html", { open: "never" }], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    baseURL: "http://localhost:4301"
  },
  webServer: {
    command:
      "pnpm --filter @stock-charts/vitepress-example run build && pnpm --filter @stock-charts/vitepress-example run preview",
    cwd: workspaceRoot,
    port: 4301,
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
