import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "lcov", "json"],
      reportsDirectory: "./coverage",
      all: true,
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.spec.ts",
        "src/test-setup.ts",
        "src/test-utils/**",
        "src/environments/**",
        "src/polyfills.ts",
        "src/main.ts",
        "src/index.html"
      ]
    }
  }
});
