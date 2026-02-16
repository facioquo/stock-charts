#!/usr/bin/env bash
set -euo pipefail

NODE_VERSION="24.13.1"
PNPM_VERSION="10.29.3"
DOTNET_VERSION="10.0"

log() { printf '\n[setup] %s\n' "$*"; }
err() { printf '\n[error] %s\n' "$*" >&2; }

# Check if Homebrew is installed
if ! command -v brew >/dev/null 2>&1; then
  err "Homebrew is not installed. Please install Homebrew first:"
  err "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
  exit 1
fi

log "Homebrew version: $(brew --version | head -n1)"

# Update Homebrew
log "Updating Homebrew..."
brew update

# Install Node.js
log "Installing Node.js v${NODE_VERSION}..."
if command -v node >/dev/null 2>&1; then
  current="$(node -v | sed 's/^v//')"
  if [[ "$current" == "$NODE_VERSION" ]]; then
    log "Node v${current} already installed; skipping"
  else
    log "Current Node version: v${current} (target: v${NODE_VERSION})"
    brew install "node@24" || brew upgrade "node@24"
  fi
else
  brew install "node@24"
fi

log "Node: $(node --version)"
log "npm:  $(npm --version)"

# Install .NET SDK
log "Installing .NET SDK v${DOTNET_VERSION}..."
if command -v dotnet >/dev/null 2>&1; then
  current="$(dotnet --version | cut -d. -f1)"
  if [[ "$current" == "10" ]]; then
    log ".NET SDK v${current}.x already installed; skipping"
  else
    log "Current .NET SDK version: ${current} (target: ${DOTNET_VERSION})"
    brew install --cask dotnet-sdk || brew upgrade --cask dotnet-sdk
  fi
else
  brew install --cask dotnet-sdk
fi

log ".NET SDK: $(dotnet --version)"
dotnet --list-sdks

# Install Azure Functions Core Tools
log "Installing Azure Functions Core Tools..."
if command -v func >/dev/null 2>&1; then
  log "Azure Functions Core Tools already installed: $(func --version)"
else
  brew tap azure/functions
  brew install azure-functions-core-tools@4
fi

log "Azure Functions Core Tools: $(func --version)"

# Install pnpm via Homebrew
log "Installing pnpm...\n"
if command -v pnpm >/dev/null 2>&1; then
  log \"pnpm already installed: $(pnpm --version)\"
else
  brew install pnpm
fi

log \"pnpm: $(pnpm --version)"

# Configure pnpm global directory
log "Configuring pnpm global directory..."
export PNPM_HOME="${HOME}/Library/pnpm"
export PATH="${PNPM_HOME}:${PATH}"
pnpm config set store-dir "${HOME}/.pnpm-store" --global 2>/dev/null || true

# Install Angular CLI globally
log "Installing Angular CLI globally..."
if command -v ng >/dev/null 2>&1; then
  ng_version=$(ng version 2>&1 | sed -n 's/^Angular CLI[[:space:]]*:[[:space:]]*\([0-9.]*\).*/\1/p')
  log "Angular CLI already installed: ${ng_version}"
else
  pnpm add -g @angular/cli
  ng_version=$(ng version 2>&1 | sed -n 's/^Angular CLI[[:space:]]*:[[:space:]]*\([0-9.]*\).*/\1/p')
  log "Angular CLI installed: ${ng_version}"
fi

# Install Node dependencies
log "📦 Installing Node dependencies (including Azurite)..."
pnpm install --frozen-lockfile --loglevel=error --config.confirmModulesPurge=false

# Verify installations
log "Verifying installations..."
log "✓ Node:     $(node --version)"
log "✓ npm:      $(npm --version)"
log "✓ pnpm:     $(pnpm --version)"
log "✓ .NET SDK: $(dotnet --version)"
log "✓ Azure Functions Core Tools: $(func --version)"

if command -v ng >/dev/null 2>&1; then
  ng_version=$(ng version 2>&1 | sed -n 's/^Angular CLI[[:space:]]*:[[:space:]]*\([0-9.]*\).*/\1/p')
  log "✓ Angular CLI: ${ng_version}"
fi

# Check if Azurite is available
if pnpm exec azurite --version >/dev/null 2>&1; then
  log "✓ Azurite:  $(pnpm exec azurite --version)"
else
  err "Azurite verification failed"
  exit 1
fi

log "✅ macOS environment setup complete!"
log ""
log "Next steps:"
log "  1. Build the project: pnpm run build"
log "  2. Start the full dev stack: Use VS Code Task 'Run: Full development stack'"
log "     or manually run in separate terminals:"
log "       Terminal 1: pnpm run azure:start"
log "       Terminal 2: cd server/Functions && func start"
log "       Terminal 3: cd server/WebApi && dotnet run"
log "       Terminal 4: pnpm start"
