#!/usr/bin/env bash
set -euo pipefail

NODE_VERSION="24.13.1"
PNPM_VERSION="10.29.3"
DOTNET_VERSION="10.0"

NODE_INSTALL_DIR="/usr/local/lib/nodejs/node-v${NODE_VERSION}"
PROFILE_SNIPPET="/etc/profile.d/node.sh"

log() { printf '\n[setup] %s\n' "$*"; }
err() { printf '\n[error] %s\n' "$*" >&2; }

# Architecture mapping for package repositories and downloads
arch="$(uname -m)"
case "$arch" in
  x86_64) MS_ARCH="amd64" ;;
  aarch64|arm64) MS_ARCH="arm64" ;;
  *) err "Unsupported architecture: $arch"; exit 1 ;;
esac

# Retry args for curl (works fine even if you don't need it)
RETRY_CURL_ARGS=(--fail --show-error --location --retry 5 --retry-delay 1 --retry-all-errors)

# Prevent apt prompts in automated environments
export DEBIAN_FRONTEND=noninteractive

# General Linux tools (3rd line is entirely for CodeRabbit CLI)
log "Installing base APT packages"
sudo apt-get update
sudo apt-get install -y --no-install-recommends ca-certificates curl git gnupg xz-utils

log "Configuring Microsoft package repository for .NET SDK"
# Get distro info
source /etc/os-release
distro_id="${ID}"
distro_version="${VERSION_ID}"

# Only Ubuntu is supported by this script at the moment
if [[ "$distro_id" != "ubuntu" ]]; then
  err "This script currently only supports Ubuntu. Detected: $distro_id"
  err "For non-Ubuntu systems, please use the Microsoft .NET install script:"
  err "  curl -sSL https://dot.net/v1/dotnet-install.sh | bash"
  exit 1
fi

# Download and install Microsoft package signing key
curl -sSL https://packages.microsoft.com/keys/microsoft.asc | sudo tee /etc/apt/trusted.gpg.d/microsoft.asc

# Add Microsoft package repository for Ubuntu
echo "deb [arch=${MS_ARCH}] https://packages.microsoft.com/repos/microsoft-ubuntu-${distro_version}-prod ${VERSION_CODENAME} main" \
  | sudo tee /etc/apt/sources.list.d/microsoft-prod.list

# Update package index
sudo apt-get update

log "Installing .NET SDK v${DOTNET_VERSION}"
sudo apt-get install -y "dotnet-sdk-${DOTNET_VERSION}"
dotnet --info
dotnet --list-sdks

# Install Roslynator dotnet tool
log "Installing Roslynator dotnet tool..."
if dotnet tool list -g | grep -q "roslynator.dotnet.cli"; then
  log "Roslynator already installed"
  dotnet tool update -g roslynator.dotnet.cli --version 0.11.0 --no-cache >/dev/null 2>&1 || true
else
  dotnet tool install -g roslynator.dotnet.cli --version 0.11.0 --no-cache
  log "Roslynator installed"
fi

# Configure .NET tools PATH
log "Configuring .NET tools PATH..."
if [ -f ~/.bashrc ] && ! grep -qF '.dotnet/tools' ~/.bashrc; then
  echo "export PATH=\$HOME/.dotnet/tools:\$PATH" >> ~/.bashrc
  log "Added .NET tools to PATH in ~/.bashrc"
fi
export PATH="$HOME/.dotnet/tools:$PATH"

# --- Install Node (no nvm) ---
log "Installing Node v${NODE_VERSION} (no nvm)"

arch="$(uname -m)"
case "$arch" in
  x86_64) node_arch="x64" ;;
  aarch64|arm64) node_arch="arm64" ;;
  *) err "Unsupported architecture: $arch"; exit 1 ;;
esac

url="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${node_arch}.tar.xz"

# If node is already exactly this version, skip.
if command -v node >/dev/null 2>&1; then
  current="$(node -v | sed 's/^v//')"
  if [[ "$current" == "$NODE_VERSION" ]]; then
    log "System node version v${current} matches desired v${NODE_VERSION}; will use system node and skip install"
    SKIP_NODE_INSTALL=1
  fi
fi
# Install if SKIP_NODE_INSTALL not set and the exact node binary isn't present in the target dir.
if [ "${SKIP_NODE_INSTALL:-0}" = "1" ]; then
  log "Skipping node install; using system node at $(command -v node)"
else
  if [[ ! -x "${NODE_INSTALL_DIR}/bin/node" ]]; then
    log "Downloading and extracting ${url} -> ${NODE_INSTALL_DIR}"
    sudo rm -rf "${NODE_INSTALL_DIR}"
    sudo mkdir -p "${NODE_INSTALL_DIR}"
    curl "${RETRY_CURL_ARGS[@]}" "$url" | sudo tar -xJ --strip-components=1 -C "${NODE_INSTALL_DIR}"
  else
    log "Node already present in ${NODE_INSTALL_DIR}"
  fi
fi

# Ensure PATH for current script run if we installed Node here
if [ "${SKIP_NODE_INSTALL:-0}" = "1" ]; then
  log "Using system node; leaving PATH unchanged"
else
  # Prepend installed node to PATH so subsequent commands use it
  export PATH="${NODE_INSTALL_DIR}/bin:${PATH}"
fi

# Ensure PATH for future shells if we installed Node here
if [ "${SKIP_NODE_INSTALL:-0}" != "1" ]; then
  if [[ ! -f "$PROFILE_SNIPPET" ]] || ! sudo grep -qF "${NODE_INSTALL_DIR}/bin" "$PROFILE_SNIPPET"; then
    log "Writing ${PROFILE_SNIPPET} to persist Node on PATH"
    sudo tee "$PROFILE_SNIPPET" >/dev/null <<EOF
# Node.js (installed by setup script)
export PATH="${NODE_INSTALL_DIR}/bin:\$PATH"
EOF
    sudo chmod 0644 "$PROFILE_SNIPPET"
  fi
fi

log "Node: $(node --version)"
log "npm:  $(npm --version)"

# Install pnpm (via Corepack)
log "Enabling Corepack and pnpm@${PNPM_VERSION}"
# Try to enable corepack (may need sudo on some systems)
if corepack enable 2>/dev/null; then
  log "Corepack enabled system-wide"
  # Only run prepare if corepack enable succeeded
  corepack prepare "pnpm@${PNPM_VERSION}" --activate || log "Corepack prepare failed, will use npx fallback"
else
  log "Corepack enable requires elevated permissions - will use via npx instead"
fi

# Configure pnpm global directory first
log "Configuring pnpm global directory..."
export PNPM_HOME="${HOME}/.local/share/pnpm"
export PATH="${PNPM_HOME}:${PATH}"

# Use npx to run pnpm setup (works even without symlinks)
npx --yes pnpm@${PNPM_VERSION} setup --force 2>/dev/null || true

# Verify pnpm is available (via npx if symlink doesn't exist)
if command -v pnpm >/dev/null 2>&1; then
  log "pnpm: $(pnpm --version)"
elif npx --yes pnpm@${PNPM_VERSION} --version >/dev/null 2>&1; then
  log "pnpm: $(npx --yes pnpm@${PNPM_VERSION} --version) (via npx)"
  # Create a shell function to use pnpm via npx
  pnpm() { npx --yes pnpm@${PNPM_VERSION} "$@"; }
  export -f pnpm
else
  err "pnpm not available"
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
log "📦 Installing Node dependencies..."
pnpm install --frozen-lockfile --loglevel=error --config.confirmModulesPurge=false

# Define cleanup to remove package manager caches and Apt lists to avoid
# carrying ephemeral installation bloat in images/environments.
# Cleanup is conservative by default on developer machines; in CI/container
# images we'll be more aggressive. Set SKIP_CLEANUP=1 to opt out.
cleanup() {
  if [ "${SKIP_CLEANUP:-0}" = "1" ]; then
    log "SKIP_CLEANUP=1; skipping cleanup"
    return 0
  fi

  log "Cleaning package manager caches and apt lists..."
  sudo apt-get clean || true
  sudo rm -rf /var/lib/apt/lists/* || true

  if command -v pnpm >/dev/null 2>&1; then
    pnpm store prune --loglevel=error || true
    # Only remove full store in CI/container environments
    if [ "${CI:-}" = "true" ] || [ "${CONTAINER:-}" = "1" ]; then
      rm -rf "${HOME}/.local/share/pnpm/store" || true
    fi
  fi

  if command -v npm >/dev/null 2>&1; then
    npm cache clean --force || true
  fi

  # Remove old temp files only (safer for interactive/dev machines). In CI
  # or when running in a container we remove everything in /tmp to reduce
  # image size. CI environments commonly set CI=true.
  if [ "${CI:-}" = "true" ] || [ "${CONTAINER:-}" = "1" ]; then
    sudo rm -rf /tmp/* || true
  else
    find /tmp -mindepth 1 -maxdepth 1 -mtime +1 -exec sudo rm -rf {} + || true
  fi
}

# Ensure cleanup runs on script exit to keep images smaller
trap cleanup EXIT

# Begin environment setup after defining cleanup handler

# Install CodeRabbit CLI
log "🐇 Installing CodeRabbit CLI"
sudo apt-get install -y libsecret-1-0 libsecret-tools gnome-keyring dbus-user-session
curl -fsSL https://cli.coderabbit.ai/install.sh | sh

# Cleanup
sudo apt autoremove --purge -y

log "✅ Environment setup complete!"
