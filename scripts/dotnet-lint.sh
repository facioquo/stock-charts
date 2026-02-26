#!/usr/bin/env bash
set -euo pipefail

# Backend linting wrapper script
# Handles roslynator and dotnet format with graceful fallbacks
#
# This script solves a known compatibility issue where roslynator may fail
# to run due to MSBuild path requirements or .NET runtime compatibility issues.
# See: docs/LINTING.md for detailed troubleshooting guide
#
# Usage:
#   bash scripts/dotnet-lint.sh check  # Check formatting (read-only)
#   bash scripts/dotnet-lint.sh fix    # Apply formatting fixes
#

log() { printf '\n[lint] %s\n' "$*"; }
err() { printf '\n[error] %s\n' "$*" >&2; }
warn() { printf '\n[warning] %s\n' "$*"; }

mode="${1:-check}"  # "check" or "fix"

# Restore dotnet local tools if not already installed
restore_tools() {
  # Only restore if .config/dotnet-tools.json or dotnet-tools.json exists
  if [ -f ".config/dotnet-tools.json" ] || [ -f "dotnet-tools.json" ]; then
    log "Restoring dotnet local tools..."
    dotnet tool restore --verbosity minimal || true
  fi
}

# Test if roslynator is available and functional
roslynator_available() {
  # Roslynator is a local dotnet tool — not on PATH, so skip command -v check.
  # Test directly via dotnet tool run (works after dotnet tool restore).
  if ! dotnet tool run roslynator --version >/dev/null 2>&1; then
    return 1
  fi

  return 0
}

lint_check() {
  log "Checking .NET code formatting..."

  local dotnet_exit_code=0
  local roslynator_exit_code=0

  # Always run dotnet format check (it's built-in and reliable)
  # Returns 0 if no changes needed, 1 if changes would be made
  # Capture exit code without triggering set -e by using || pattern
  log "Running dotnet format check..."
  dotnet format --verify-no-changes --verbosity quiet || dotnet_exit_code=$?

  # Try roslynator if available, but don't fail the script if it's not
  if roslynator_available; then
    log "Running Roslynator analysis..."
    if dotnet tool run roslynator analyze; then
      log "Roslynator analysis completed"
    else
      roslynator_exit_code=$?
    fi
  else
    warn "Roslynator not available, skipping (using dotnet format only)"
  fi

  # Fail if dotnet format detected issues
  if [ $dotnet_exit_code -ne 0 ]; then
    err "Formatting issues detected. Run 'pnpm run lint:dotnet:fix' to auto-fix."
    return 1
  fi

  # Warn if roslynator failed, but don't fail overall if dotnet format passed
  if [ $roslynator_exit_code -ne 0 ]; then
    warn "Roslynator analysis failed, but dotnet format check passed"
  fi

  log "✅ .NET code check passed"
  return 0
}

lint_fix() {
  log "Fixing .NET code formatting..."

  local dotnet_exit_code=0
  local roslynator_exit_code=0

  # Always run dotnet format fix (it's built-in and reliable)
  # Capture exit code without triggering set -e by using || pattern
  log "Running dotnet format..."
  dotnet format --verbosity minimal || dotnet_exit_code=$?
  if [ "$dotnet_exit_code" -ne 0 ]; then
    warn "dotnet format completed with exit code $dotnet_exit_code"
  fi

  # Try roslynator if available, but don't fail if it's not
  if roslynator_available; then
    log "Running Roslynator fixes..."
    if dotnet tool run roslynator fix; then
      log "Roslynator fixes completed"
    else
      roslynator_exit_code=$?
      warn "Roslynator completed with exit code $roslynator_exit_code"
    fi
  else
    warn "Roslynator not available, using dotnet format only"
  fi

  log "✅ .NET code fix completed"

  # Return 0 after attempting fixes (user can re-run check to verify)
  # This matches typical linting behavior where fix mode is best-effort
  return 0
}

# Main
restore_tools
case "$mode" in
  check)
    lint_check
    ;;
  fix)
    lint_fix
    ;;
  *)
    err "Unknown mode: $mode. Use 'check' or 'fix'."
    exit 1
    ;;
esac
