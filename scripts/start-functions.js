#!/usr/bin/env node
/**
 * Cross-platform script to start Azure Functions locally.
 * Copies local.settings.example.json → local.settings.json if missing.
 *
 * Replaces the POSIX-only shell one-liner:
 *   [ -f local.settings.json ] || cp local.settings.example.json local.settings.json && func start
 *
 * For VS Code developers: invoked by the "Run: Azure Functions" task.
 * For CLI use: node scripts/start-functions.js
 */

import { existsSync, copyFileSync } from "fs";
import { spawn, spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const functionsDir = path.join(__dirname, "..", "server", "Functions");
const settingsFile = path.join(functionsDir, "local.settings.json");
const exampleFile = path.join(functionsDir, "local.settings.example.json");

if (!existsSync(settingsFile)) {
  if (!existsSync(exampleFile)) {
    console.error(`Missing example settings file: ${exampleFile}`);
    process.exit(1);
  }

  copyFileSync(exampleFile, settingsFile);
  console.log("Created local.settings.json from local.settings.example.json");
}

console.log("Starting Azure Functions...");

// Allowlist: only these two platform-specific literals are ever spawned.
// On Windows 'func' is wrapped as 'func.cmd'.
const FUNC_CMD = process.platform === "win32" ? "func.cmd" : "func";
const NPX_CMD = "npx";

function checkFuncAvailable(cmdName) {
  try {
    if (process.platform === "win32") {
      // 'where' returns non-zero when not found
      const res = spawnSync("where", [cmdName], { stdio: "ignore" });
      return res.status === 0;
    } else {
      // 'which' is a standalone binary available on POSIX systems
      const res = spawnSync("which", [cmdName], { stdio: "ignore" });
      return res.status === 0;
    }
  } catch (e) {
    return false;
  }
}

if (!checkFuncAvailable(FUNC_CMD)) {
  console.error("Azure Functions Core Tools 'func' was not found in PATH.");
  console.error("Install it from https://learn.microsoft.com/azure/azure-functions/functions-run-local#install-the-azure-functions-core-tools\n");
  console.error("If you use npm: `npm i -g azure-functions-core-tools@4` (or use the platform installer). Ensure the 'func' command is on your PATH and restart your terminal/VS Code.");
  process.exit(1);
}
/** Attempt to spawn FUNC_CMD directly (no shell). Returns ChildProcess or syncError wrapper. */
function spawnFuncDirect() {
  try {
    return spawn(FUNC_CMD, ["start"], {
      cwd: functionsDir,
      stdio: "inherit",
      shell: false
    });
  } catch (err) {
    return { syncError: err };
  }
}

/**
 * Windows fallback: .cmd files need cmd.exe to run; use an explicit cmd.exe invocation
 * instead of shell:true so the command string is never interpreted by a shell.
 */
function spawnFuncViaCmd() {
  try {
    return spawn("cmd.exe", ["/c", "func", "start"], {
      cwd: functionsDir,
      stdio: "inherit",
      shell: false
    });
  } catch (err) {
    return { syncError: err };
  }
}

/** Spawn via npx as a last-resort fallback when func is not on PATH but is available via npm. */
function spawnNpxFallback() {
  try {
    return spawn(NPX_CMD, ["azure-functions-core-tools@4", "start"], {
      cwd: functionsDir,
      stdio: "inherit",
      shell: false
    });
  } catch (err) {
    return { syncError: err };
  }
}

let funcProcess = spawnFuncDirect();

if (funcProcess && funcProcess.syncError) {
  // On Windows, .cmd wrappers require cmd.exe; retry with explicit cmd.exe invocation.
  if (process.platform === "win32") {
    console.warn(`Direct spawn failed (${funcProcess.syncError.code}). Retrying via cmd.exe...`);
    funcProcess = spawnFuncViaCmd();
  }
}

if (funcProcess && funcProcess.syncError) {
  // Try npx fallback to run Azure Functions Core Tools if available via npm.
  console.warn("Shell fallback failed. Trying 'npx azure-functions-core-tools@4' as a fallback...");
  funcProcess = spawnNpxFallback();
}

if (!funcProcess || funcProcess.syncError) {
  const errMsg = funcProcess && funcProcess.syncError ? funcProcess.syncError.message : "unknown error";
  console.error(`Failed to start Azure Functions (all strategies): ${errMsg}`);
  process.exit(1);
}

funcProcess.on("error", (err) => {
  console.error(`Failed to start Azure Functions: ${err.message}`);
  process.exit(1);
});

funcProcess.on("close", (code, signal) => {
  if (signal) {
    process.exit(1);
  } else {
    process.exit(code ?? 0);
  }
});
