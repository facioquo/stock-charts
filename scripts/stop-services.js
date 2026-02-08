#!/usr/bin/env node

const { spawn } = require("child_process");
const os = require("os");

const isWindows = os.platform() === "win32";

console.log("🛑 Stopping all development services...");

// Fire off all termination commands without waiting
if (isWindows) {
  const currentPid = process.pid;
  const cmds = [
    `taskkill /F /IM node.exe /FI "PID ne ${currentPid}"`,
    "taskkill /F /IM func.exe",
    "taskkill /F /IM dotnet.exe",
  ];
  // WARNING: The following taskkill commands will terminate ALL func.exe and dotnet.exe processes system-wide.
  // This is destructive and may affect unrelated .NET or Azure Function processes.
  // Consider tracking PIDs for more targeted kills in future improvements.
  cmds.forEach(cmd => {
    // Split command and args for spawn
    const [command, ...args] = cmd.split(" ");
    const child = spawn(command, args, { detached: true, stdio: "ignore" });
    child.unref();
  });
  console.log("✅ Windows termination commands sent");
} else {
  const cmds = [
    "lsof -ti:4200,5000,5001,7071,10000 | xargs -r kill -TERM",
    "pkill -TERM -x func",
    "pkill -TERM -x dotnet",
  ];
  cmds.forEach(cmd => {
    // Split command and args for spawn
    const [command, ...args] = cmd.split(" ");
    const child = spawn(command, args, { detached: true, stdio: "ignore" });
    child.unref();
  });
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
