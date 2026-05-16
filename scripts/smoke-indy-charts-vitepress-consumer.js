import { mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { spawnSync } from "child_process";

const workspaceRoot = path.resolve(import.meta.dirname, "..");
const tempRoot = mkdtempSync(path.join(tmpdir(), "indy-charts-consumer-"));
const packDir = path.join(tempRoot, "tarballs");
const consumerDir = path.join(tempRoot, "consumer");
const pnpmCli = process.env["npm_execpath"];

if (!pnpmCli) {
  throw new Error("Unable to locate the pnpm CLI. Run this smoke test through pnpm.");
}

function runPnpm(args, cwd = workspaceRoot) {
  const result = spawnSync(process.execPath, [pnpmCli, ...args], {
    cwd,
    stdio: "inherit"
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `pnpm ${args.join(" ")} failed with exit code ${result.status ?? "unknown"}`
    );
  }
}

function packageFileSpec(fromDir, filePath) {
  const relativePath = path.relative(fromDir, filePath).replaceAll(path.sep, "/");
  return `file:${relativePath.startsWith(".") ? relativePath : `./${relativePath}`}`;
}

function packedTarball(packageName) {
  const fileNamePrefix = packageName.replace("@", "").replace("/", "-");
  const match = readdirSync(packDir).find(
    fileName => fileName.startsWith(fileNamePrefix) && fileName.endsWith(".tgz")
  );
  if (!match) {
    throw new Error(`Unable to find packed tarball for ${packageName}`);
  }
  return path.join(packDir, match);
}

try {
  mkdirSync(packDir, { recursive: true });
  mkdirSync(path.join(consumerDir, "docs", ".vitepress", "theme"), { recursive: true });

  runPnpm(["--filter", "@facioquo/indy-charts...", "run", "build"]);
  runPnpm(["--filter", "@facioquo/indy-charts", "pack", "--pack-destination", packDir]);

  const indyChartsTarball = packedTarball("@facioquo/indy-charts");

  writeFileSync(
    path.join(consumerDir, "package.json"),
    `${JSON.stringify(
      {
        name: "indy-charts-packed-vitepress-consumer",
        private: true,
        type: "module",
        scripts: {
          build: "vitepress build docs"
        },
        dependencies: {
          "@facioquo/indy-charts": packageFileSpec(consumerDir, indyChartsTarball),
          "chart.js": "4.5.1",
          "chartjs-plugin-annotation": "3.1.0",
          vitepress: "2.0.0-alpha.16",
          vue: "3.5.33"
        },
      },
      null,
      2
    )}\n`
  );

  writeFileSync(
    path.join(consumerDir, "docs", ".vitepress", "config.ts"),
    `import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Packed indy-charts smoke test",
  vite: {
    ssr: {
      noExternal: ["@facioquo/indy-charts", "chart.js"]
    }
  }
});
`
  );

  writeFileSync(
    path.join(consumerDir, "docs", ".vitepress", "theme", "index.ts"),
    `import DefaultTheme from "vitepress/theme";

import { setupIndyChartsForVue } from "@facioquo/indy-charts/vue";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    setupIndyChartsForVue(app, {
      api: { baseUrl: "https://localhost:5001" },
      indicators: {
        rsi: { uiid: "RSI", params: { lookbackPeriods: 14 }, results: ["rsi"] }
      }
    });
  }
};
`
  );

  writeFileSync(
    path.join(consumerDir, "docs", "index.md"),
    `# Packed package consumer

<ClientOnly>
  <StockIndicatorChart indicator="rsi" />
</ClientOnly>
`
  );

  runPnpm(["install", "--ignore-scripts"], consumerDir);
  runPnpm(["run", "build"], consumerDir);
  console.log("Packed VitePress consumer smoke test passed.");
} finally {
  if (!process.env["INDY_CHARTS_SMOKE_KEEP_TEMP"]) {
    rmSync(tempRoot, { recursive: true, force: true });
  } else {
    console.log(`Keeping smoke test directory: ${tempRoot}`);
  }
}
