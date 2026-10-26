#!/usr/bin/env node
/**
 * Starts the Codacy MCP server that `pnpm run setup:codacy-mcp` installed.
 *
 * It never installs on demand: a cold install outlasts the MCP client's
 * startup timeout, and an install killed partway leaves a broken copy that
 * fails every later launch.
 */

// Raised when the install is missing, or partial with a module half-written
const INCOMPLETE_INSTALL = new Set(["ERR_MODULE_NOT_FOUND", "ERR_UNSUPPORTED_DIR_IMPORT"]);

try {
  await import("../tools/codacy-mcp/node_modules/@codacy/codacy-mcp/dist/index.js");
} catch (error) {
  if (!INCOMPLETE_INSTALL.has(error?.code)) throw error;
  process.stderr.write(
    `Codacy MCP server is missing or incomplete (${error.code}). Run \`pnpm run setup:codacy-mcp\`, then reconnect.\n`
  );
  process.exit(1);
}
