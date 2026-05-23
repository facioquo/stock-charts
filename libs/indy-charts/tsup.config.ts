import { defineConfig } from "tsup";
import { copyFile } from "fs/promises";
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
    await copyFile(resolve("README.md"), resolve("dist/README.md"));
  }
});
