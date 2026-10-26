#!/usr/bin/env node
/**
 * Starts the Codacy MCP server that `pnpm run setup:codacy-mcp` installed.
 *
 * It never installs on demand: a cold install outlasts the MCP client's
 * startup timeout, and an install killed partway leaves a broken copy that
 * fails every later launch.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE_DIR = join(
  ROOT,
  "tools",
  "codacy-mcp",
  "node_modules",
  "@codacy",
  "codacy-mcp"
);
const MANIFEST = join(PACKAGE_DIR, "package.json");

if (!existsSync(MANIFEST)) {
  process.stderr.write(
    "Codacy MCP server is not installed. Run `pnpm run setup:codacy-mcp`, then reconnect.\n"
  );
  process.exit(1);
}

const { bin } = JSON.parse(readFileSync(MANIFEST, "utf8"));
const entry = typeof bin === "string" ? bin : Object.values(bin)[0];

await import(pathToFileURL(join(PACKAGE_DIR, entry)).href);
