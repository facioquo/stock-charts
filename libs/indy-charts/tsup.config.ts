import { defineConfig } from "tsup";

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
  clean: true
});
