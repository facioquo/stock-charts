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
  }
});
