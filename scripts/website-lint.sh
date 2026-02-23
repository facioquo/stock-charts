#!/usr/bin/env bash
set -euo pipefail

# Angular CLI linting wrapper script
# Suppresses autocompletion prompt that blocks tasks on first run
#
# The Angular CLI's `ng completion` prompt occurs on first lint run before
# CLI arg processing, blocking task execution. This script suppresses it by
# providing stdin answer 'n' via here-string.
#
# Usage:
#   bash scripts/website-lint.sh check  # ng lint (check mode)
#   bash scripts/website-lint.sh fix    # ng lint --fix (fix mode)
#

mode="${1:-check}"  # "check" or "fix"

log() { printf '[lint] %s\n' "$*"; }
err() { printf '[error] %s\n' "$*" >&2; }

case "$mode" in
  check)
    log "Running Angular linting checks..."
    # Suppress autocompletion prompt with here-string, preserve all output
    # Capture exit code without triggering set -e by using || pattern
    pnpm --filter @stock-charts/client run lint <<<"n" || lint_exit=$?

    # Lint libraries (TypeScript packages)
    log "Running library linting checks..."
    pnpm --filter './libs/**' run lint --max-warnings=0 || lib_lint_exit=$?

    # Lint VitePress example
    log "Running VitePress linting checks..."
    pnpm --filter @stock-charts/vitepress-example run lint --max-warnings=0 || vitepress_lint_exit=$?

    # Format Angular code
    log "Checking Angular code formatting..."
    pnpm run format:web:check || format_exit=$?

    if [ "${lint_exit:-0}" -ne 0 ] || [ "${lib_lint_exit:-0}" -ne 0 ] || [ "${vitepress_lint_exit:-0}" -ne 0 ] || [ "${format_exit:-0}" -ne 0 ]; then
      err "Angular linting or formatting issues detected"
      exit 1
    fi

    log "✅ Angular lint check passed"
    exit 0
    ;;

  fix)
    log "Running Angular linting fixes..."
    # Suppress autocompletion prompt with here-string, preserve all output
    # Capture exit code without triggering set -e by using || pattern
    pnpm --filter @stock-charts/client run lint:fix <<<"n" || lint_exit=$?

    # Fix libraries (TypeScript packages)
    log "Running library linting fixes..."
    pnpm --filter './libs/**' run lint:fix || lib_lint_exit=$?

    # Fix VitePress example
    log "Running VitePress linting fixes..."
    pnpm --filter @stock-charts/vitepress-example run lint:fix || vitepress_lint_exit=$?

    # Format Angular code
    log "Formatting Angular code..."
    pnpm run format:web || format_exit=$?

    if [ "${lint_exit:-0}" -ne 0 ] || [ "${lib_lint_exit:-0}" -ne 0 ] || [ "${vitepress_lint_exit:-0}" -ne 0 ] || [ "${format_exit:-0}" -ne 0 ]; then
      err "Angular linting or formatting completed with issues (see output above)"
      # Don't exit 1 for fix mode - user can review and re-run check
    fi

    log "✅ Angular lint fix completed"
    exit 0
    ;;

  *)
    err "Unknown mode: $mode. Use 'check' or 'fix'."
    exit 1
    ;;
esac
