import { copyFile, readFile, writeFile } from "fs/promises";
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

    // Authored as `llms.md` so markdownlint covers it, shipped under the
    // conventional `llms.txt` name agents look for.
    await copyFile(resolve("llms.md"), resolve("dist/llms.txt"));
    // info.version tracks the package version, so the shipped contract always
    // states the release it belongs to without anyone editing two files.
    const { version } = JSON.parse(await readFile(resolve("package.json"), "utf8")) as {
      version: string;
    };
    const contract = await readFile(resolve("backing-api.yml"), "utf8");
    const versioned = contract.replace(/^ {2}version: ".*"$/m, `  version: "${version}"`);

    // A silent no-op here would ship a contract stating the wrong release.
    if (!versioned.includes(`  version: "${version}"`)) {
      throw new Error(`backing-api.yml: could not set info.version to ${version}`);
    }

    await writeFile(resolve("dist/backing-api.yml"), versioned);
  }
});
