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

// Ensure the Azure Functions Core Tools `func` executable is available.
// On Windows the executable is exposed as 'func.cmd'.
const funcCmd = process.platform === "win32" ? "func.cmd" : "func";

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

if (!checkFuncAvailable(process.platform === "win32" ? "func.cmd" : "func")) {
  console.error("Azure Functions Core Tools 'func' was not found in PATH.");
  console.error("Install it from https://learn.microsoft.com/azure/azure-functions/functions-run-local#install-the-azure-functions-core-tools\n");
  console.error("If you use npm: `npm i -g azure-functions-core-tools@4` (or use the platform installer). Ensure the 'func' command is on your PATH and restart your terminal/VS Code.");
  process.exit(1);
}
// Allowlist of commands that may be spawned by this script.
const ALLOWED_COMMANDS = new Set(["func", "func.cmd", "npx"]);

function trySpawn(cmd, args, opts) {
  if (!ALLOWED_COMMANDS.has(cmd)) {
    return { syncError: new Error(`Blocked: '${cmd}' is not an allowed command`) };
  }
  try {
    return spawn(cmd, args, opts);
  } catch (err) {
    return { syncError: err };
  }
}

let funcProcess = trySpawn(funcCmd, ["start"], {
  cwd: functionsDir,
  stdio: "inherit"
});

if (funcProcess && funcProcess.syncError) {
  // Synchronous spawn error (e.g., EINVAL on some shells). Try shell fallback.
  console.warn(`Spawn failed (${funcProcess.syncError.code}). Retrying with shell fallback...`);
  funcProcess = trySpawn(funcCmd, ["start"], {
    cwd: functionsDir,
    stdio: "inherit",
    shell: true
  });
}

if (funcProcess && funcProcess.syncError) {
  // Try npx fallback to run Azure Functions Core Tools if available via npm.
  console.warn("Shell fallback failed. Trying 'npx azure-functions-core-tools@4' as a fallback...");
  funcProcess = trySpawn("npx", ["azure-functions-core-tools@4", "start"], {
    cwd: functionsDir,
    stdio: "inherit",
    shell: false
  });
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
