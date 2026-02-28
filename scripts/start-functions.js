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
import { spawn } from "child_process";
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

// On Windows, 'func' is a .cmd wrapper that requires the explicit extension.
// Avoid shell:true (Node DEP0190) by resolving the platform-specific executable.
const funcCmd = process.platform === "win32" ? "func.cmd" : "func";
const func = spawn(funcCmd, ["start"], {
  cwd: functionsDir,
  stdio: "inherit"
});

func.on("error", (err) => {
  console.error(`Failed to start Azure Functions: ${err.message}`);
  process.exit(1);
});

func.on("close", (code, signal) => {
  if (signal) {
    process.exit(1);
  } else {
    process.exit(code ?? 0);
  }
});
