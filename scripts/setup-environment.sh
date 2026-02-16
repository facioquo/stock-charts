#!/usr/bin/env bash
set -euo pipefail

# Stock Charts - Universal Development Environment Setup
# Detects the operating system and runs the appropriate platform-specific setup script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() { printf '\n[setup] %s\n' "$*"; }
err() { printf '\n[error] %s\n' "$*" >&2; }

# Detect operating system
detect_os() {
  local os_name
  os_name="$(uname -s)"

  case "$os_name" in
    Linux*)
      echo "linux"
      ;;
    Darwin*)
      echo "macos"
      ;;
    CYGWIN*|MINGW*|MSYS*)
      echo "windows"
      ;;
    *)
      err "Unsupported operating system: $os_name"
      exit 1
      ;;
  esac
}

main() {
  local os_type
  os_type="$(detect_os)"

  log "Detected operating system: $os_type"
  log "Running platform-specific setup script..."
  echo ""

  case "$os_type" in
    macos)
      if [[ ! -f "$SCRIPT_DIR/setup-macos.sh" ]]; then
        err "macOS setup script not found: $SCRIPT_DIR/setup-macos.sh"
        exit 1
      fi

      log "Executing macOS setup (Homebrew-based)..."
      bash "$SCRIPT_DIR/setup-macos.sh"
      ;;

    linux)
      if [[ ! -f "$SCRIPT_DIR/setup-linux.sh" ]]; then
        err "Linux setup script not found: $SCRIPT_DIR/setup-linux.sh"
        exit 1
      fi

      log "Executing Linux setup (apt-get-based)..."
      bash "$SCRIPT_DIR/setup-linux.sh"
      ;;

    windows)
      if [[ ! -f "$SCRIPT_DIR/setup-windows.sh" ]]; then
        err "Windows setup script not found: $SCRIPT_DIR/setup-windows.sh"
        exit 1
      fi

      log "Executing Windows setup (Git Bash with winget)..."
      bash "$SCRIPT_DIR/setup-windows.sh"
      ;;

    *)
      err "Unhandled operating system type: $os_type"
      exit 1
      ;;
  esac
}

main "$@"
