#!/usr/bin/env node
/**
 * Sets up a compatibility shim for @playwright/test so that the VS Code
 * Playwright MCP extension can run tests using the same playwright runtime
 * it uses internally.
 *
 * The VS Code MCP extension uses its own playwright process. When test spec
 * files import "@playwright/test", Node.js must resolve to that SAME playwright
 * instance (by file path) or the test state (_currentSuite) won't be shared,
 * causing "Playwright Test did not expect test.describe() to be called here".
 *
 * This script overwrites node_modules/@playwright/test/index.js to redirect
 * to the playwright instance the MCP uses. The MCP extension locates playwright
 * via pnpm's npx cache (the global `playwright` CLI).
 */

"use strict";

const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const AT_PW_TEST_INDEX = path.join(
  ROOT,
  "node_modules",
  "@playwright",
  "test",
  "index.js"
);

if (!fs.existsSync(AT_PW_TEST_INDEX)) {
  process.stdout.write(
    "Playwright MCP shim: @playwright/test not installed, skipping.\n"
  );
  process.exit(0);
}

/**
 * Find ALL playwright test.js files in global npx/pnpm caches.
 * The VS Code MCP extension uses one of these. We pick the one matching
 * the workspace playwright version (1.58.2).
 * @returns {string[]}
 */
function findAllCachedPlaywrightTestJs() {
  const results = [];

  // Directories that may contain npx hash-caches with playwright installs
  const searchDirs = [
    // pnpm on non-default drive (e.g., D:\packages\npm\_npx\)
    "D:\\packages\\npm\\_npx",
    // Windows npm default cache
    path.join(process.env["LOCALAPPDATA"] || "", "npm-cache", "_npx"),
    path.join(
      process.env["USERPROFILE"] || "",
      "AppData",
      "Local",
      "npm-cache",
      "_npx"
    ),
    // pnpm cache
    path.join(process.env["LOCALAPPDATA"] || "", "pnpm", "cache", "npx"),
    // macOS/Linux
    path.join(process.env["HOME"] || "", ".npm", "_npx")
  ].filter(Boolean);

  for (const searchDir of searchDirs) {
    if (!fs.existsSync(searchDir)) continue;
    try {
      for (const hash of fs.readdirSync(searchDir)) {
        const candidate = path.join(
          searchDir,
          hash,
          "node_modules",
          "playwright",
          "test.js"
        );
        if (fs.existsSync(candidate)) {
          results.push(candidate);
        }
      }
    } catch {
      // ignore errors walking the cache
    }
  }

  return results;
}

/**
 * Find the playwright test.js used by the VS Code MCP extension.
 * @returns {string|null}
 */
function findMcpPlaywrightTestJs() {
  const WORKSPACE_PW_VERSION = "1.58.2";
  const candidates = findAllCachedPlaywrightTestJs();

  // Prefer candidate matching workspace playwright version
  for (const candidate of candidates) {
    try {
      const pkgPath = path.join(path.dirname(candidate), "package.json");
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      if (pkg.version === WORKSPACE_PW_VERSION) {
        return candidate;
      }
    } catch {
      // if can't check version, still use it as fallback
    }
  }

  // Fallback: return first candidate found
  return candidates[0] ?? null;
}

let mcpPlaywrightTestJs = findMcpPlaywrightTestJs();

if (!mcpPlaywrightTestJs) {
  const manualPath = process.argv[2];

  if (manualPath) {
    if (fs.existsSync(manualPath) && fs.statSync(manualPath).isFile()) {
      mcpPlaywrightTestJs = manualPath;
    } else {
      process.stdout.write(
        `Playwright MCP shim: Provided path does not exist or is not a file: ${manualPath}\n`
      );
      process.exit(1);
    }
  } else {
    process.stdout.write(
      "Playwright MCP shim: Could not find MCP playwright runtime.\n" +
        "  To set up manually, run:\n" +
        "    node scripts/setup-playwright-mcp.cjs <path-to-playwright-test.js>\n"
    );
    process.exit(1);
  }
}

const shimContent = `module.exports = require(${JSON.stringify(mcpPlaywrightTestJs)});\n`;
fs.writeFileSync(AT_PW_TEST_INDEX, shimContent);
process.stdout.write(`Playwright MCP shim applied → ${mcpPlaywrightTestJs}\n`);
