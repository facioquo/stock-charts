#!/usr/bin/env node
/**
 * Simple cross-platform script to stop development services
 *
 * For VS Code developers:
 *   - Use: pnpm run stop:services
 *   - Or: Press Ctrl+C in the terminal running services (preferred)
 *
 * This script force-kills known service processes.
 * For graceful shutdown, press Ctrl+C in the terminal where services are running.
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
    execSync(cmd, { stdio: "pipe" });
    console.log(`✅ ${description}`);
  } catch {
    // Silently ignore errors (expected if service isn't running)
    console.log(`ℹ️  ${description} (no running processes)`);
  }
}

if (isWindows) {
  // Windows: Simple taskkill with exact process names
  tryKill("taskkill /F /IM node.exe 2>nul", "Killed node.exe processes");
  tryKill("taskkill /F /IM func.exe 2>nul", "Killed func.exe (Azure Functions)");
  tryKill("taskkill /F /IM dotnet.exe 2>nul", "Killed dotnet.exe (.NET)");
} else {
  // Unix/macOS: pkill with exact-name matching (-x flag)
  // Simple, reliable, and works on both Linux and macOS
  tryKill("pkill -TERM -x node || true", "Terminated node processes");
  tryKill("pkill -TERM -x func || true", "Terminated func (Azure Functions)");
  tryKill("pkill -TERM -x dotnet || true", "Terminated dotnet (.NET)");
}

console.log("\n✨ Development services stopped\n");
console.log("💡 Tip: For graceful shutdown, press Ctrl+C in service terminals\n");
