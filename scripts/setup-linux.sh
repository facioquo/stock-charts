#!/usr/bin/env bash
set -euo pipefail

# Development and CI environment setup
# Supports both:
#  - Local WSL/Ubuntu distributions
#  - Codex Universal (https://github.com/openai/codex-universal)
#
# Pre-installed in Codex Universal: apt-get, nvm, pnpm, .NET SDK

log() { printf '\n[setup] %s\n' "$*"; }
err() { printf '\n[error] %s\n' "$*" >&2; }
warn() { printf '\n[warning] %s\n' "$*"; }

# Detect environment and privileges
can_sudo() { sudo -n true 2>/dev/null || false; }
is_codex_universal() { [ -f "/.codex-universal" ]; }

# =========================================================================
# APT Package Management (with privilege detection)
# =========================================================================
apt_update() {
  if command -v apt-get &>/dev/null; then
    log "Updating APT packages"
    if can_sudo; then
      sudo apt-get update -qq || true
    else
      apt-get update -qq || true
    fi
  else
    warn "apt-get not available, skipping package updates"
  fi
}

apt_install() {
  local packages=("$@")
  if command -v apt-get &>/dev/null && [ ${#packages[@]} -gt 0 ]; then
    if can_sudo; then
      sudo apt-get install -y "${packages[@]}" || true
    else
      apt-get install -y "${packages[@]}" || true
    fi
  fi
}

# =========================================================================
# Node Version Manager (nvm)
# =========================================================================
setup_nvm() {
  if command -v nvm &>/dev/null; then
    log "nvm already installed"
    return 0
  fi

  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    log "nvm directory found, sourcing nvm"
    source "$HOME/.nvm/nvm.sh"
    return 0
  fi

  warn "nvm not found, attempting installation via official installer"

  # Download nvm installer to temp file so curl failures are caught separately from execution
  local nvm_version="v0.40.4"
  local tmp_nvm
  tmp_nvm=$(mktemp /tmp/nvm-install-XXXXXX.sh)
  trap 'rm -f "$tmp_nvm"; trap - RETURN' RETURN

  if ! curl -fsSL -o "$tmp_nvm" "https://raw.githubusercontent.com/nvm-sh/nvm/$nvm_version/install.sh" || \
     [ ! -s "$tmp_nvm" ]; then # nosemgrep: bash.curl.security.curl-pipe-bash
    err "Failed to download nvm installer"
    return 1
  fi

  # Execute the nvm installer
  bash "$tmp_nvm" || { err "Failed to execute nvm installer"; return 1; }
}

# =========================================================================
# Node.js
# =========================================================================
setup_node() {
  local node_version="${NODE_VERSION:-24.14.0}"

  # Try to use nvm if available
  if command -v nvm &>/dev/null || [ -s "$HOME/.nvm/nvm.sh" ]; then
    log "Installing Node.js v${node_version} via nvm"
    setup_nvm || { err "nvm setup failed"; return 1; }
    source "$HOME/.nvm/nvm.sh"
    nvm install "$node_version" || { err "Failed to install Node $node_version"; return 1; }
    nvm use "$node_version" || { err "Failed to activate Node $node_version"; return 1; }
    log "Node: $(node --version)"
    log "npm : $(npm --version)"
    return 0
  fi

  # Install if SKIP_NODE_INSTALL not set and the exact node binary isn't present in the target dir.
  if [ "${SKIP_NODE_INSTALL:-0}" = "1" ]; then
    log "Skipping node install; using system node at $(command -v node)"
  else
    if [[ ! -x "${NODE_INSTALL_DIR}/bin/node" ]]; then
      log "Downloading and extracting ${NODEJS_URL} -> ${NODE_INSTALL_DIR}"
      if can_sudo; then
        sudo rm -rf "${NODE_INSTALL_DIR}"
        sudo mkdir -p "${NODE_INSTALL_DIR}"
        curl "${RETRY_CURL_ARGS[@]}" "${NODEJS_URL}" | sudo tar -xJ --strip-components=1 -C "${NODE_INSTALL_DIR}"
      else
        rm -rf "${NODE_INSTALL_DIR}"
        mkdir -p "${NODE_INSTALL_DIR}"
        curl "${RETRY_CURL_ARGS[@]}" "${NODEJS_URL}" | tar -xJ --strip-components=1 -C "${NODE_INSTALL_DIR}"
      fi
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
    if [[ ! -f "$PROFILE_SNIPPET" ]] || ! grep -qF "${NODE_INSTALL_DIR}/bin" "$PROFILE_SNIPPET"; then
      log "Writing ${PROFILE_SNIPPET} to persist Node on PATH"
      if can_sudo; then
        sudo tee "$PROFILE_SNIPPET" >/dev/null <<EOF
# Node.js (installed by setup script)
export PATH="${NODE_INSTALL_DIR}/bin:\$PATH"
EOF
        sudo chmod 0644 "$PROFILE_SNIPPET"
      else
        tee "$PROFILE_SNIPPET" >/dev/null <<EOF
# Node.js (installed by setup script)
export PATH="${NODE_INSTALL_DIR}/bin:\$PATH"
EOF
        chmod 0644 "$PROFILE_SNIPPET"
      fi
    fi
  fi

  log "Node: $(node --version)"
  log "npm : $(npm --version)"
}

# =========================================================================
# pnpm Package Manager
# =========================================================================
setup_pnpm() {
  if ! command -v pnpm &>/dev/null; then
    log "Installing pnpm globally"
    npm install -g pnpm || { err "Failed to install pnpm globally"; return 1; }
  fi

  log "pnpm: $(pnpm --version)"
}

# =========================================================================
# .NET SDK
# =========================================================================
setup_dotnet() {
  local dotnet_version="${DOTNET_VERSION:-10.0}"

  if command -v dotnet &>/dev/null; then
    log "Existing .NET SDKs:"
    dotnet --list-sdks || log "(Could not list SDKs)"

    # Verify the required SDK major version is installed
    local major="${dotnet_version%%.*}"
    if dotnet --list-sdks 2>/dev/null | grep -q "^${major}\."; then
      log ".NET SDK v${dotnet_version} series already installed"
      return 0
    fi

    warn ".NET SDK v${dotnet_version} series not found among installed SDKs; attempting install"
  fi

  log "Installing .NET SDK v$dotnet_version"

  # On Debian, dotnet-sdk-10.0 is not in default repositories.
  # Add Microsoft's official APT feed before attempting to install.
  # Note: Ubuntu 22.04+ ships .NET in the official Ubuntu Universe APT repository;
  # adding the Microsoft feed on Ubuntu creates package conflicts.
  if command -v apt-get &>/dev/null && [[ -f /etc/os-release ]]; then
    local distro_id version_id
    distro_id=$(. /etc/os-release && echo "${ID:-}")
    version_id=$(. /etc/os-release && echo "${VERSION_ID:-}")

    if [[ "$distro_id" == "debian" ]] && [[ -n "$version_id" ]]; then
      log "Adding Microsoft APT feed for ${distro_id} ${version_id}"

      # Ensure HTTPS transport prerequisites are present
      apt_install apt-transport-https ca-certificates

      # Register the Microsoft packages repository via the official .deb package
      local ms_pkg_deb
      ms_pkg_deb=$(mktemp /tmp/packages-microsoft-prod-XXXXXX.deb)

      if curl -fsSL -o "$ms_pkg_deb" \
          "https://packages.microsoft.com/config/${distro_id}/${version_id}/packages-microsoft-prod.deb" && \
         [[ -s "$ms_pkg_deb" ]]; then
        if can_sudo; then
          sudo dpkg -i "$ms_pkg_deb" || warn "Microsoft APT feed registration failed"
        else
          dpkg -i "$ms_pkg_deb" || warn "Microsoft APT feed registration failed"
        fi
      else
        warn "Could not download Microsoft packages config; dotnet install may fail"
      fi

      rm -f "$ms_pkg_deb"
      apt_update
    fi
  fi

  apt_install "dotnet-sdk-${dotnet_version}"

  # Verify the requested .NET version was actually installed
  if ! command -v dotnet &>/dev/null; then
    err "Failed to install .NET SDK ${dotnet_version}: dotnet command not found"
    return 1
  fi

  log "Installed .NET SDKs:"
  dotnet --list-sdks || true

  # Parse dotnet --list-sdks output to verify the requested version
  if ! dotnet --list-sdks | grep -q "^${dotnet_version}\."; then
    err "Failed to install .NET SDK ${dotnet_version}: requested version not found in installed SDKs"
    return 1
  fi
}

# =========================================================================
# .NET Tools (if dotnet is available)
# =========================================================================
setup_dotnet_tools() {
  if ! command -v dotnet &>/dev/null; then
    warn "dotnet not available, skipping dotnet tools"
    return 0
  fi

  log "Cleaning package manager caches and apt lists..."
  if can_sudo; then
    sudo apt-get clean || true
    sudo rm -rf /var/lib/apt/lists/* || true
  fi

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

# =========================================================================
# Cleanup (runs on script exit)
# =========================================================================
cleanup() {
  setup_dotnet_tools || true
}

# =========================================================================
# CodeRabbit CLI
# =========================================================================
setup_coderabbit() {
  log "🐇 Installing CodeRabbit CLI"
  if can_sudo; then
    sudo apt-get install -y libsecret-1-0 libsecret-tools gnome-keyring dbus-user-session || true
  else
    apt-get install -y libsecret-1-0 libsecret-tools gnome-keyring dbus-user-session || true
  fi
  # nosemgrep: bash.curl.security.curl-pipe-bash
  curl -fsSL https://cli.coderabbit.ai/install.sh | sh || warn "CodeRabbit CLI install failed"
}

# =========================================================================
# Main
# =========================================================================
main() {
  # Ensure cleanup runs on script exit to keep images smaller
  trap cleanup EXIT

  apt_update
  setup_node
  setup_pnpm
  setup_dotnet
  setup_coderabbit

  log "✅ Environment setup complete!"
}

main "$@"
