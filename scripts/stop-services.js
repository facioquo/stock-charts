#!/usr/bin/env node
/* global setImmediate, setTimeout */

import { spawn } from "child_process";
import os from "os";

const isWindows = os.platform() === "win32";

console.log("🛑 Stopping all development services...");

// Helper to run a command (string or array) via spawn without waiting
function runCmd(cmd) {
  if (Array.isArray(cmd)) {
    const [command, ...args] = cmd;
    // Note: All commands are hardcoded; no user-controllable input
    // nosemgrep: javascript.lang.security.detect-child-process
    const child = spawn(command, args, { detached: true, stdio: "ignore" });
    child.unref();
    return;
  }
  // string: use shell=true for pipes, redirects, and complex syntax
  // Note: All commands are hardcoded; no user-controllable input
  // nosemgrep: javascript.lang.security.detect-child-process
  const child = spawn(cmd, [], { shell: true, detached: true, stdio: "ignore" });
  child.unref();
}

// Fire off all termination commands without waiting
if (isWindows) {
  const currentPid = process.pid;
  // Use a targeted PowerShell query to only stop func/dotnet processes
  // whose command line references this repository (reduces blast radius).
  // Falls back to killing node.exe (excluding the current process) as before.
  const repoMarker = "stock-charts";
  const nodeKill = `taskkill /F /IM node.exe /FI "PID ne ${currentPid}"`;
  const targetedKill = [
    "powershell",
    "-NoProfile",
    "-Command",
    `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and $_.CommandLine -like "*${repoMarker}*" -and ($_.Name -in @("func.exe", "dotnet.exe")) } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`,
  ];

  runCmd(nodeKill);
  runCmd(targetedKill);
  console.log("✅ Windows targeted termination commands sent");
} else {
  const cmds = [
    "lsof -ti:4200,5000,5001,7071,10000 | xargs kill -TERM 2>/dev/null",
    "pkill -TERM -x func",
    "pkill -TERM -x dotnet"
  ];
  cmds.forEach(runCmd);
  console.log("✅ Unix termination commands sent");
}

console.log("⏳ Waiting 2 seconds for graceful shutdown...");

// Use setImmediate to ensure other events process, then exit
setImmediate(() => {
  setTimeout(() => {
    console.log("✨ Done");
    process.exit(0);
  }, 2000);
});
