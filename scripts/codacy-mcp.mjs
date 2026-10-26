#!/usr/bin/env node
/**
 * Starts the Codacy MCP server that `pnpm run setup:codacy-mcp` installed.
 *
 * It never installs on demand: a cold install outlasts the MCP client's
 * startup timeout, and an install killed partway leaves a broken copy that
 * fails every later launch.
 */

import { existsSync } from "node:fs";

const ENTRY = new URL(
  "../tools/codacy-mcp/node_modules/@codacy/codacy-mcp/dist/index.js",
  import.meta.url
);

if (!existsSync(ENTRY)) {
  process.stderr.write(
    "Codacy MCP server is not installed. Run `pnpm run setup:codacy-mcp`, then reconnect.\n"
  );
  process.exit(1);
}

await import("../tools/codacy-mcp/node_modules/@codacy/codacy-mcp/dist/index.js");
