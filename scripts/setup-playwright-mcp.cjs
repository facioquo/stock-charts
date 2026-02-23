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
  // Allow overriding the npx search root via NPX_SEARCH_DIR env var
  // (e.g., NPX_SEARCH_DIR=D:\packages\npm\_npx for non-default pnpm installs)
  const envSearchDir = process.env["NPX_SEARCH_DIR"] || null;

  const searchDirs = [
    // Optional env-override for custom npx cache locations (e.g., pnpm on non-default drive)
    ...(envSearchDir ? [envSearchDir] : []),
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
 * Read the @playwright/test version declared in the playwright workspace package.json.
 * Falls back to a hardcoded version if the file cannot be read.
 * @returns {string}
 */
function getWorkspacePlaywrightVersion() {
  try {
    const pkgPath = path.join(ROOT, "tests", "playwright", "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const version =
      (pkg.devDependencies ?? {})["@playwright/test"] ??
      (pkg.dependencies ?? {})["@playwright/test"];
    // Strip semver range prefix (^, ~, >=, etc.)
    return version ? version.replace(/^[^0-9]*/, "") : "1.58.2";
  } catch {
    return "1.58.2";
  }
}

/**
 * Find the playwright test.js used by the VS Code MCP extension.
 * @returns {string|null}
 */
function findMcpPlaywrightTestJs() {
  const WORKSPACE_PW_VERSION = getWorkspacePlaywrightVersion();
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
    // A path was explicitly supplied — normalize, then validate and fail loudly if wrong.
    const resolvedPath = path.resolve(manualPath);
    try {
      if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
        mcpPlaywrightTestJs = resolvedPath;
      } else {
        process.stdout.write(
          `Playwright MCP shim: Provided path does not exist or is not a file: ${resolvedPath}\n`
        );
        process.exit(1);
      }
    } catch (err) {
      process.stdout.write(
        `Playwright MCP shim: Error validating path ${resolvedPath}: ${err.message}\n`
      );
      process.exit(1);
    }
  } else {
    // No MCP runtime found and no manual path given — this is expected in CI/CD
    // environments (Cloudflare Pages, GitHub Actions, etc.) where the VS Code
    // MCP extension is not installed.  Exit cleanly so postinstall does not
    // block the build.
    process.stdout.write(
      "Playwright MCP shim: MCP playwright runtime not found, skipping (not a VS Code MCP environment).\n"
    );
    process.exit(0);
  }
}

const shimContent = `module.exports = require(${JSON.stringify(mcpPlaywrightTestJs)});\n`;
fs.writeFileSync(AT_PW_TEST_INDEX, shimContent);
process.stdout.write(`Playwright MCP shim applied → ${mcpPlaywrightTestJs}\n`);
