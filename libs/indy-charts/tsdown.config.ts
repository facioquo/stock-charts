import { copyFile } from "fs/promises";
import { resolve } from "path";

import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "index.ts",
    "vue/index": "vue/index.ts"
  },
  format: ["esm"],
  // The package is ESM-only ("type": "module"), so plain .js/.d.ts are already
  // ESM — and the package.json exports map points at those names.
  outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
  dts: true,
  deps: {
    // Bundle the workspace financial-charts library into both the JS and the
    // declaration outputs so consumers install a single package.
    alwaysBundle: ["@facioquo/chartjs-chart-financial"],
    dts: {
      alwaysBundle: ["@facioquo/chartjs-chart-financial"]
    }
  },
  sourcemap: true,
  clean: true,
  onSuccess: async () => {
    await copyFile(resolve("README.md"), resolve("dist/README.md"));
  }
});
