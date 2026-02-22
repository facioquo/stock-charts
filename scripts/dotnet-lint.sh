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

# Get MSBuild path - find the latest SDK
get_msbuild_path() {
  # Find the latest .NET SDK directory
  local sdk_path
  sdk_path=$(dotnet --list-sdks | tail -1 | awk '{print $NF}' | sed 's/\[//;s/\]//')

  if [ -z "$sdk_path" ] || [ ! -d "$sdk_path" ]; then
    return 1
  fi

  echo "$sdk_path"
}

# Test if roslynator is available and functional
roslynator_available() {
  # Check if roslynator command exists
  if ! command -v roslynator &>/dev/null; then
    return 1
  fi

  # Get MSBuild path
  local msbuild_path
  if ! msbuild_path=$(get_msbuild_path); then
    return 1
  fi

  # Test if roslynator can run (version check is lightweight)
  if roslynator --version >/dev/null 2>&1; then
    return 0
  fi

  return 1
}

lint_check() {
  log "Checking .NET code formatting..."

  local dotnet_exit_code=0
  local roslynator_exit_code=0

  # Always run dotnet format check (it's built-in and reliable)
  # Returns 0 if no changes needed, 1 if changes would be made
  # Capture exit code without triggering set -e by using || pattern
  dotnet format --verify-no-changes --verbosity quiet || dotnet_exit_code=$?

  # Try roslynator if available, but don't fail the script if it's not
  if roslynator_available; then
    local msbuild_path
    msbuild_path=$(get_msbuild_path)

    log "Running Roslynator analysis..."
    if roslynator analyze --msbuild-path "$msbuild_path"; then
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
  dotnet format --verbosity minimal || dotnet_exit_code=$?
  if [ "$dotnet_exit_code" -ne 0 ]; then
    warn "dotnet format completed with exit code $dotnet_exit_code"
  fi

  # Try roslynator if available, but don't fail if it's not
  if roslynator_available; then
    local msbuild_path
    msbuild_path=$(get_msbuild_path)

    log "Running Roslynator fixes..."
    if roslynator fix --msbuild-path "$msbuild_path"; then
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
