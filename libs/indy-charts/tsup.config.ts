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
    resolve: ["@facioquo/chartjs-chart-financial"],
    compilerOptions: {
      // tsup v8 injects `baseUrl: "."` into its d.ts build (dist/rollup.js:
      // `baseUrl: compilerOptions.baseUrl || "."`), and TypeScript 6 fails on
      // the deprecated option with TS5101. No tsconfig in this repo sets
      // baseUrl — this tolerance is scoped to the injected option only and
      // can be removed once tsup stops injecting it.
      ignoreDeprecations: "6.0"
    }
  },
  noExternal: ["@facioquo/chartjs-chart-financial"],
  sourcemap: true,
  clean: true,
  onSuccess: async () => {
    await copyFile(resolve("README.md"), resolve("dist/README.md"));
  }
});
