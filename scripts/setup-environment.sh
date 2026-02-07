#!/usr/bin/env bash
set -euo pipefail

NODE_VERSION="24.13.0"
PNPM_VERSION="10.28.2"

NODE_INSTALL_DIR="/usr/local/lib/nodejs/node-v${NODE_VERSION}"
PROFILE_SNIPPET="/etc/profile.d/node.sh"

log() { printf '\n[setup] %s\n' "$*"; }
err() { printf '\n[error] %s\n' "$*" >&2; }

# Retry args for curl (works fine even if you don't need it)
RETRY_CURL_ARGS=(--fail --show-error --location --retry 5 --retry-delay 1 --retry-all-errors)

# Prevent apt prompts in automated environments
export DEBIAN_FRONTEND=noninteractive

# General Linux tools (3rd line is entirely for CodeRabbit CLI)
log "Installing base APT packages"
sudo apt-get update
sudo apt-get install -y --no-install-recommends ca-certificates curl git gnupg xz-utils

log "Installing .NET SDK"
sudo apt-get install -y dotnet-sdk-10.0
dotnet --info
dotnet --list-sdks

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
corepack enable || true
corepack prepare "pnpm@${PNPM_VERSION}" --activate

if ! command -v pnpm >/dev/null 2>&1; then
  err "pnpm not found after Corepack activation"
  exit 1
fi

log "pnpm: $(pnpm --version)"

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
    pnpm cache clean --force || true
    rm -rf "${HOME}/.local/share/pnpm/store" || true
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

# Install CodeRabbit CLI
log "🐇 Installing CodeRabbit CLI"
sudo apt-get install -y libsecret-1-0 libsecret-tools gnome-keyring dbus-user-session
curl -fsSL https://cli.coderabbit.ai/install.sh | sh

# Cleanup
sudo apt autoremove --purge -y

log "✅ Environment setup complete!"
