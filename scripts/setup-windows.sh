#!/usr/bin/env bash
set -euo pipefail

# Stock Charts - Windows Development Environment Setup (Git Bash)
# Assumes Git Bash for Windows is installed

NODE_VERSION="24.13.1"
PNPM_VERSION="10.29.3"
DOTNET_VERSION="10.0"

log() { printf '\n[setup] %s\n' "$*"; }
err() { printf '\n[error] %s\n' "$*" >&2; }

# Check if running in Git Bash on Windows
is_git_bash() {
  [[ "$(uname -s)" =~ ^(CYGWIN|MINGW|MSYS) ]]
}

if ! is_git_bash; then
  err "This script is designed for Git Bash on Windows"
  err "Detected OS: $(uname -s)"
  exit 1
fi

log "Stock Charts Windows Setup (Git Bash)"

# Check for winget
if ! command -v winget.exe >/dev/null 2>&1; then
  err "winget (Windows Package Manager) is not installed or not in PATH"
  err "Please install from: https://aka.ms/getwinget"
  err ""
  err "Or install prerequisites manually:"
  err "  1. Node.js v24.13.1 LTS: https://nodejs.org/"
  err "  2. .NET SDK v10.0: https://dotnet.microsoft.com/download/dotnet/10.0"
  err "  3. Azure Functions Core Tools v4: https://learn.microsoft.com/azure/azure-functions/functions-run-local#windows"
  exit 1
fi

log "Found winget"

# Install Node.js
log "Checking Node.js installation..."
if command -v node >/dev/null 2>&1; then
  current="$(node -v | sed 's/^v//')"
  log "Node v${current} already installed"
  if [[ ! "$current" =~ ^24\. ]]; then
    log "Warning: Expected Node.js v24.x, found v${current}"
    log "Consider upgrading to v${NODE_VERSION}"
  fi
else
  log "Installing Node.js v${NODE_VERSION} LTS..."
  winget.exe install --id OpenJS.NodeJS.LTS --version "${NODE_VERSION}" --silent --accept-package-agreements --accept-source-agreements
  # Refresh command hash to pick up newly installed binaries
  hash -r 2>/dev/null || true
  log "Node.js installed."
fi

# Verify Node.js
if command -v node >/dev/null 2>&1; then
  log "Node: $(node --version)"
  log "npm:  $(npm --version)"
else
  log "Node.js not found in PATH after installation."
  log "Please restart Git Bash and run this script again to complete setup."
  log ""
  log "To restart: Close this window and open a new Git Bash terminal."
  exit 1
fi

# Install .NET SDK
log "Checking .NET SDK installation..."
if command -v dotnet.exe >/dev/null 2>&1 || command -v dotnet >/dev/null 2>&1; then
  dotnet_cmd="dotnet"
  command -v dotnet.exe >/dev/null 2>&1 && dotnet_cmd="dotnet.exe"

  current="$($dotnet_cmd --version | cut -d. -f1)"
  log ".NET SDK v$($dotnet_cmd --version) already installed"
  dotnet_major_version="$(echo "${DOTNET_VERSION}" | cut -d. -f1)"
  if [[ "$current" != "$dotnet_major_version" ]]; then
    log "Warning: Expected .NET SDK v${DOTNET_VERSION}, found v$($dotnet_cmd --version)"
    log "Consider upgrading to v${DOTNET_VERSION}"
  fi
else
  log "Installing .NET SDK v${DOTNET_VERSION}..."
  winget.exe install --id Microsoft.DotNet.SDK.10 --silent --accept-package-agreements --accept-source-agreements
  # Refresh command hash
  hash -r 2>/dev/null || true
  log ".NET SDK installed."
fi

# Verify .NET SDK
if command -v dotnet.exe >/dev/null 2>&1 || command -v dotnet >/dev/null 2>&1; then
  dotnet_cmd="dotnet"
  command -v dotnet.exe >/dev/null 2>&1 && dotnet_cmd="dotnet.exe"
  log ".NET SDK: $($dotnet_cmd --version)"
  $dotnet_cmd --list-sdks
else
  log ".NET SDK not found in PATH after installation."
  log "Please restart Git Bash and run this script again to complete setup."
  log ""
  log "To restart: Close this window and open a new Git Bash terminal."
  exit 1
fi

# Install Azure Functions Core Tools
log "Checking Azure Functions Core Tools installation..."
if command -v func >/dev/null 2>&1 || command -v func.exe >/dev/null 2>&1; then
  func_cmd="func"
  command -v func.exe >/dev/null 2>&1 && func_cmd="func.exe"
  log "Azure Functions Core Tools already installed: $($func_cmd --version)"
else
  log "Installing Azure Functions Core Tools v4..."
  winget.exe install --id Microsoft.Azure.FunctionsCoreTools --silent --accept-package-agreements --accept-source-agreements
  # Refresh command hash
  hash -r 2>/dev/null || true
  log "Azure Functions Core Tools installed."
fi

# Verify Azure Functions Core Tools
if command -v func >/dev/null 2>&1 || command -v func.exe >/dev/null 2>&1; then
  func_cmd="func"
  command -v func.exe >/dev/null 2>&1 && func_cmd="func.exe"
  log "Azure Functions Core Tools: $($func_cmd --version)"
else
  log "Azure Functions Core Tools not found in PATH after installation."
  log "Please restart Git Bash and run this script again to complete setup."
  log ""
  log "To restart: Close this window and open a new Git Bash terminal."
  exit 1
fi

# Install Roslynator dotnet tool
log "Installing Roslynator dotnet tool..."
dotnet_cmd="dotnet"
command -v dotnet.exe >/dev/null 2>&1 && dotnet_cmd="dotnet.exe"
if $dotnet_cmd tool list -g | grep -q "roslynator.dotnet.cli"; then
  log "Roslynator already installed"
  $dotnet_cmd tool update -g roslynator.dotnet.cli --version 0.11.0 --no-cache >/dev/null 2>&1 || true
else
  $dotnet_cmd tool install -g roslynator.dotnet.cli --version 0.11.0 --no-cache
  log "Roslynator installed"
fi

# Configure .NET tools PATH (Git Bash on Windows)
log "Configuring .NET tools PATH..."
profile="${HOME}/.bash_profile"
[ ! -f "$profile" ] && [ -f "${HOME}/.bashrc" ] && profile="${HOME}/.bashrc"
if [ -f "$profile" ] && ! grep -qF '.dotnet/tools' "$profile"; then
  echo "export PATH=\"\$HOME/.dotnet/tools:\$PATH\"" >> "$profile"
  log "Added .NET tools to PATH in $profile"
fi
export PATH="$HOME/.dotnet/tools:$PATH"

# Install pnpm via winget
log "Installing pnpm..."
if command -v pnpm >/dev/null 2>&1; then
  current="$(pnpm --version)"
  log "pnpm v${current} already installed"
  if [[ "$current" != "$PNPM_VERSION" ]]; then
    log "Warning: Expected pnpm v${PNPM_VERSION}, found v${current}"
    log "Consider upgrading to v${PNPM_VERSION}"
  fi
else
  log "Installing pnpm via winget..."
  winget.exe install --id pnpm.pnpm --silent --accept-package-agreements --accept-source-agreements
  # Refresh command hash
  hash -r 2>/dev/null || true
  log "pnpm installed."
fi

# Configure pnpm global directory
if command -v pnpm >/dev/null 2>&1; then
  log "pnpm: $(pnpm --version)"
  export PNPM_HOME="${LOCALAPPDATA}/pnpm"
  export PATH="${PNPM_HOME}:${PATH}"
  pnpm config set store-dir "${LOCALAPPDATA}/.pnpm-store" --global 2>/dev/null || true
else
  log "pnpm not found in PATH after installation."
  log "Please restart Git Bash and run this script again to complete setup."
  log ""
  log "To restart: Close this window and open a new Git Bash terminal."
  exit 1
fi

# Install Angular CLI globally
log "Installing Angular CLI globally..."
if command -v ng >/dev/null 2>&1; then
  ng_version=$(ng version 2>&1 | sed -n 's/^Angular CLI[[:space:]]*:[[:space:]]*\([0-9.]*\).*/\1/p' || echo "unknown")
  log "Angular CLI already installed: ${ng_version}"
else
  pnpm add -g @angular/cli
  ng_version=$(ng version 2>&1 | sed -n 's/^Angular CLI[[:space:]]*:[[:space:]]*\([0-9.]*\).*/\1/p' || echo "unknown")
  log "Angular CLI installed: ${ng_version}"
fi

# Change to repository root
log "Changing to repository root..."
cd "$(dirname "$0")/.." || exit 1

# Install Node dependencies
log "📦 Installing Node dependencies (including Azurite)..."
pnpm install --frozen-lockfile --loglevel=error --config.confirmModulesPurge=false

# Verify installations
log "Verifying installations..."
log "✓ Node:     $(node --version)"
log "✓ npm:      $(npm --version)"
log "✓ pnpm:     $(pnpm --version)"

if command -v dotnet.exe >/dev/null 2>&1 || command -v dotnet >/dev/null 2>&1; then
  dotnet_cmd="dotnet"
  command -v dotnet.exe >/dev/null 2>&1 && dotnet_cmd="dotnet.exe"
  log "✓ .NET SDK: $($dotnet_cmd --version)"
fi

if command -v func >/dev/null 2>&1 || command -v func.exe >/dev/null 2>&1; then
  func_cmd="func"
  command -v func.exe >/dev/null 2>&1 && func_cmd="func.exe"
  log "✓ Azure Functions Core Tools: $($func_cmd --version)"
fi

if command -v ng >/dev/null 2>&1; then
  ng_version=$(ng version 2>&1 | sed -n 's/^Angular CLI[[:space:]]*:[[:space:]]*\([0-9.]*\).*/\1/p' || echo "unknown")
  log "✓ Angular CLI: ${ng_version}"
fi

# Check Azurite (use proper argument forwarding)
if pnpm exec -- azurite -- --version >/dev/null 2>&1; then
  log "✓ Azurite:  $(pnpm exec -- azurite -- --version)"
else
  err "Azurite verification failed"
  exit 1
fi

log "✅ Windows (Git Bash) environment setup complete!"
log ""
log "Next steps:"
log "  1. Build the project: pnpm run build"
log "  2. Start the full dev stack: Use VS Code Task 'Run: Full development stack'"
log "     or manually run in separate terminals:"
log "       Terminal 1: pnpm run azure:start"
log "       Terminal 2: cd server/Functions && func start"
log "       Terminal 3: cd server/WebApi && dotnet run"
log "       Terminal 4: pnpm start"
