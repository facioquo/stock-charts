#!/usr/bin/env node
/**
 * Simple cross-platform script to stop development services
 *
 * For VS Code developers:
 *   - Use: pnpm run stop:services
 *   - Or: Press Ctrl+C in the terminal running services (preferred)
 *
 * This script force-kills Azure Functions and .NET processes.
 * Node processes are NOT killed to avoid terminating this script itself.
 * For Node services, press Ctrl+C in their terminal for graceful shutdown.
 */

import { execSync } from "child_process";
import os from "os";

const isWindows = os.platform() === "win32";

console.log("🛑 Stopping development services...\n");

/**
 * Execute command, silently ignore if no processes found
 * (some commands may fail if no matching processes exist, which is expected)
 */
function tryKill(cmd, description) {
  try {
    execSync(cmd, { stdio: "ignore" });
    console.log(`✅ ${description}`);
  } catch (error) {
    // Silently ignore errors (expected if service isn't running)
    console.log(`ℹ️  ${description} (no running processes)`);
  }
}

if (isWindows) {
  // Windows: Simple task kill with exact process names
  // Note: Skipping node.exe to avoid killing this script itself
  // Users should use Ctrl+C in terminals running Node services
  tryKill("taskkill /F /IM func.exe", "Killed func.exe (Azure Functions)");
  tryKill("taskkill /F /IM dotnet.exe", "Killed dotnet.exe (.NET)");
} else {
  // Unix/macOS: pkill with exact-name matching (-x flag)
  // Note: Skipping node to avoid killing this script itself
  // Users should use Ctrl+C in terminals running Node services
  tryKill("pkill -TERM -x func", "Terminated func (Azure Functions)");
  tryKill("pkill -TERM -x dotnet", "Terminated dotnet (.NET)");
}

console.log("\n✨ Development services stopped\n");
console.log("💡 Tip: For graceful shutdown, press Ctrl+C in service terminals\n");
