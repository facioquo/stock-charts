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

// shell: true resolves 'func' from PATH on Windows, where it is a .cmd wrapper.
const func = spawn("func", ["start"], {
  cwd: functionsDir,
  stdio: "inherit",
  shell: true,
});

func.on("error", (err) => {
  console.error(`Failed to start Azure Functions: ${err.message}`);
  process.exit(1);
});

func.on("close", (code) => {
  process.exit(code ?? 0);
});
