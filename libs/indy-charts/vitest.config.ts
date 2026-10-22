import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@facioquo/chartjs-chart-financial": resolve(
        import.meta.dirname,
        "../chartjs-financial/index.ts"
      )
    }
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["**/*.ts"],
      exclude: [
        "**/*.spec.ts",
        "**/*.d.ts",
        "dist/**",
        "eslint.config.ts",
        "tsdown.config.ts",
        "vitest.config.ts"
      ],
      // Set just under measured coverage so a drop fails CI; raise them as coverage grows.
      thresholds: {
        statements: 83,
        branches: 76,
        functions: 84,
        lines: 85
      }
    }
  }
});
