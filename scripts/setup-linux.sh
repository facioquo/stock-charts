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
is_codex_universal() { [ -d "/opt/miniconda3" ] || [ -f "/.codex-universal" ]; }

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
  trap 'rm -f "$tmp_nvm"' RETURN

  if ! curl -fsSL -o "$tmp_nvm" "https://raw.githubusercontent.com/nvm-sh/nvm/$nvm_version/install.sh" || \
     [ ! -s "$tmp_nvm" ]; then # nosemgrep: bash.curl.security.curl-pipe-bash
    err "Failed to download nvm installer"
    return 1
  fi

  if ! bash "$tmp_nvm"; then
    err "Failed to run nvm installer"
    return 1
  fi

  # Source nvm after installation
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    log "nvm installed and sourced"
  else
    err "Failed to install nvm; some Node features may be unavailable"
    return 1
  fi
}

# =========================================================================
# Node.js
# =========================================================================
setup_node() {
  local node_version="24.13.1"

  if ! command -v node &>/dev/null; then
    log "Node not found, installing via nvm"
    setup_nvm || return 1
    nvm install "$node_version"
    nvm use "$node_version"
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
    npm install -g pnpm
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
    return 0
  fi

  log "Installing .NET SDK v$dotnet_version"

  # On Debian/Ubuntu, dotnet-sdk-10.0 is not in default repositories.
  # Add Microsoft's official APT feed before attempting to install.
  if command -v apt-get &>/dev/null && [[ -f /etc/os-release ]]; then
    local distro_id version_id
    distro_id=$(. /etc/os-release && echo "${ID:-}")
    version_id=$(. /etc/os-release && echo "${VERSION_ID:-}")

    if [[ "$distro_id" == "ubuntu" || "$distro_id" == "debian" ]] && [[ -n "$version_id" ]]; then
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

  if command -v dotnet &>/dev/null; then
    log "Installed .NET SDKs:"
    dotnet --list-sdks || true
  else
    err "Failed to install .NET SDK"
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

  log "Restoring dotnet tools (dotnet format, roslynator, etc)..."
  if dotnet tool restore; then
    log "Dotnet tools restored successfully"

    # Verify critical tools are available via dotnet tool list
    if dotnet tool list --global 2>/dev/null | grep -q "dotnet-format" || \
       dotnet tool list 2>/dev/null | grep -q "dotnet-format"; then
      log "✓ dotnet format is available (primary linting tool)"
    fi

    if dotnet tool list --global 2>/dev/null | grep -qiE "roslynator|dotnet-roslynator" || \
       dotnet tool list 2>/dev/null | grep -qiE "roslynator|dotnet-roslynator"; then
      log "✓ roslynator is available (optional analyzer)"
      warn "Note: roslynator may have compatibility issues with your .NET SDK version"
      warn "See scripts/dotnet-lint.sh for recommended linting approach"
    fi
  else
    warn "dotnet tool restore completed with warnings (some tools may be unavailable)"
  fi
}

# =========================================================================
# Angular CLI
# =========================================================================
setup_angular_cli() {
  if command -v ng &>/dev/null; then
    log "Angular CLI already installed: $(ng version --minimal 2>/dev/null || echo 'version unknown')"
    return 0
  fi

  log "Installing Angular CLI globally..."
  pnpm install -g @angular/cli || { err "Angular CLI installation failed"; return 1; }
}

# =========================================================================
# CodeRabbit CLI (Optional - only if curl available and not in restricted env)
# =========================================================================
setup_coderabbit() {
  # Check if coderabbit already exists
  if command -v coderabbit &>/dev/null; then
    log "🐇 CodeRabbit CLI already installed, updating..."
    coderabbit update || warn "CodeRabbit CLI update had issues"
    return 0
  fi

  if ! command -v curl &>/dev/null; then
    warn "curl not available, skipping CodeRabbit CLI"
    return 0
  fi

  # Check if we're in a restricted environment
  if is_codex_universal; then
    log "Skipping CodeRabbit CLI in Codex Universal environment"
    return 0
  fi

  # Only install CodeRabbit if privileged
  if ! can_sudo; then
    warn "Insufficient privileges for CodeRabbit CLI, skipping"
    return 0
  fi

  log "🐇 Installing CodeRabbit CLI"
  apt_install libsecret-1-0 libsecret-tools gnome-keyring dbus-user-session

  # Official CodeRabbit CLI installer: curl|bash is the only supported install method
  if curl -fsSL https://cli.coderabbit.ai/install.sh | bash; then # nosemgrep: bash.curl.security.curl-pipe-bash
    log "CodeRabbit CLI installed"
  else
    warn "CodeRabbit CLI installation failed or skipped"
  fi
}

# =========================================================================
# Node Dependencies
# =========================================================================
setup_node_dependencies() {
  log "📦 Installing Node dependencies..."
  pnpm install --frozen-lockfile --loglevel=error --config.confirmModulesPurge=false || {
    err "pnpm install failed"
    return 1
  }
}

# =========================================================================
# Cleanup (environment-aware)
# =========================================================================
cleanup() {
  log "Pruning caches and cleaning up environment..."

  # pnpm cleanup (always safe)
  pnpm store prune --loglevel=error 2>/dev/null || true

  # apt cleanup (only if we have apt-get)
  if command -v apt-get &>/dev/null; then
    if can_sudo; then
      sudo apt-get clean -qq 2>/dev/null || true
      sudo apt-get autoclean -qq 2>/dev/null || true
      sudo apt-get autoremove -yqq 2>/dev/null || true
    else
      apt-get clean -qq 2>/dev/null || true
    fi
  fi
}

# =========================================================================
# Main Setup Flow
# =========================================================================
main() {
  log "Starting environment setup..."

  if is_codex_universal; then
    log "Detected Codex Universal environment"
  else
    log "Detected local Linux environment (WSL/native)"
  fi

  # Core tools (required)
  setup_nvm || warn "nvm setup had issues, continuing"
  setup_node || { err "Node.js setup failed"; exit 1; }
  setup_pnpm || { err "pnpm setup failed"; exit 1; }
  setup_dotnet || warn ".NET SDK setup had issues, continuing"

  # Tooling (required if core tools available)
  setup_dotnet_tools || warn "dotnet tools had issues, continuing"
  setup_angular_cli || warn "Angular CLI setup had issues, continuing"

  # Optional tools
  setup_coderabbit || true

  # Dependencies
  setup_node_dependencies || { err "Node dependency installation failed"; exit 1; }

  # Cleanup
  cleanup

  log "✅ Environment setup complete!"
}

main "$@"
