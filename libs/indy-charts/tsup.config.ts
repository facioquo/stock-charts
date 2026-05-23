import { defineConfig } from "tsup";
import { copyFileSync } from "fs";
import { resolve } from "path";

export default defineConfig({
  entry: {
    index: "index.ts",
    "vue/index": "vue/index.ts"
  },
  format: ["esm"],
  dts: {
    resolve: ["@facioquo/chartjs-chart-financial"]
  },
  noExternal: ["@facioquo/chartjs-chart-financial"],
  sourcemap: true,
  clean: true,
  onSuccess: async () => {
    await Promise.resolve();
    copyFileSync(resolve("README.md"), resolve("dist/README.md"));
  }
});
