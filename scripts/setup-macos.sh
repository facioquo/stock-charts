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

# Ensure node@24 is available immediately after install/upgrade
# (Homebrew uses keg-only formula that isn't on PATH by default)
if [ -d "$(brew --prefix node@24 2>/dev/null || echo '')" ]; then
  node_path="$(brew --prefix node@24)/bin"
  export PATH="${node_path}:$PATH"
  log "Added node@24 to PATH: $node_path"
fi

log "Node: $(node --version)"
log "npm:  $(npm --version)"

# Install .NET SDK
log "Installing .NET SDK v${DOTNET_VERSION}..."
if command -v dotnet >/dev/null 2>&1; then
  current="$(dotnet --version | cut -d. -f1)"
  # Derive target major version from DOTNET_VERSION constant for consistency
  target_major="${DOTNET_VERSION%%.*}"
  if [[ "$current" == "$target_major" ]]; then
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

# Install Roslynator dotnet tool
log "Installing Roslynator dotnet tool..."
if dotnet tool list -g | grep -q "roslynator.dotnet.cli"; then
  log "Roslynator already installed"
  dotnet tool update -g roslynator.dotnet.cli --version 0.11.0 --no-cache >/dev/null 2>&1 || true
else
  dotnet tool install -g roslynator.dotnet.cli --version 0.11.0 --no-cache
  log "Roslynator installed"
fi

# Configure .NET tools PATH (add to both .zshrc and .zprofile for all contexts)
log "Configuring .NET tools PATH..."
for profile in ~/.zshrc ~/.zprofile; do
  if [ -f "$profile" ] && ! grep -qF '.dotnet/tools' "$profile"; then
    echo "export PATH=\"\$HOME/.dotnet/tools:\$PATH\"" >> "$profile"
    log "Added .NET tools to PATH in $profile"
  fi
done
export PATH="$HOME/.dotnet/tools:$PATH"

# Install pnpm via Homebrew
log "Installing pnpm..."
if command -v pnpm >/dev/null 2>&1; then
  current="$(pnpm --version)"
  log "pnpm v${current} already installed"
else
  brew install pnpm 2>/dev/null || {
    log "Homebrew pnpm installation may have version differences from ${PNPM_VERSION}"
    log "Installing pnpm globally via npm..."
    npm install -g pnpm
  }
  log "pnpm installed"
fi

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
log "✓ .NET SDK: $(dotnet --version)"
log "✓ Azure Functions Core Tools: $(func --version)"

if command -v ng >/dev/null 2>&1; then
  ng_version=$(ng version 2>&1 | sed -n 's/^Angular CLI[[:space:]]*:[[:space:]]*\([0-9.]*\).*/\1/p')
  log "✓ Angular CLI: ${ng_version}"
fi

# Check if Azurite is available
if pnpm exec -- azurite -- --version >/dev/null 2>&1; then
  log "✓ Azurite:  $(pnpm exec -- azurite -- --version)"
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
