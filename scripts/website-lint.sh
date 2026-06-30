#!/usr/bin/env bash
set -euo pipefail

# Website lint/format wrapper script (React + libraries + VitePress)
#
# Usage:
#   bash scripts/website-lint.sh check  # check formatting and lint
#   bash scripts/website-lint.sh fix    # fix formatting

mode="${1:-check}"  # "check" or "fix"

log() { printf '\n[lint] %s\n' "$*"; }
err() { printf '[error] %s\n' "$*" >&2; }

case "$mode" in
  check)
    # Lint chartjs-financial and indy-charts libraries
    log "Running library linting checks..."
    pnpm --filter '@facioquo/chartjs-chart-financial' run lint --max-warnings=0 || lib_lint_exit=$?
    pnpm --filter '@facioquo/indy-charts' run lint --max-warnings=0 || indy_lint_exit=$?

    # Lint VitePress example
    log "Running VitePress linting checks..."
    pnpm --filter @stock-charts/vitepress-example run lint --max-warnings=0 || vitepress_lint_exit=$?

    # Format web and vscode
    log "Checking web code formatting..."
    pnpm run format:web:check || format_exit=$?

    # Format libraries (Prettier check)
    log "Checking library code formatting..."
    pnpm --filter '@facioquo/chartjs-chart-financial' run format:check || lib_format_exit=$?
    pnpm --filter '@facioquo/indy-charts' run format:check || indy_format_exit=$?

    # Lint CSS files
    log "Running CSS linting checks..."
    pnpm run lint:css || css_lint_exit=$?

    if [ "${lib_lint_exit:-0}" -ne 0 ] || [ "${indy_lint_exit:-0}" -ne 0 ] || [ "${vitepress_lint_exit:-0}" -ne 0 ] || [ "${format_exit:-0}" -ne 0 ] || [ "${lib_format_exit:-0}" -ne 0 ] || [ "${indy_format_exit:-0}" -ne 0 ] || [ "${css_lint_exit:-0}" -ne 0 ]; then
      err "Linting or formatting issues detected"
      exit 1
    fi

    log "✅ Lint check passed"
    exit 0
    ;;

  fix)
    # Fix chartjs-financial and indy-charts libraries
    log "Running library linting fixes..."
    pnpm --filter '@facioquo/chartjs-chart-financial' run lint:fix || lib_lint_exit=$?
    pnpm --filter '@facioquo/indy-charts' run lint:fix || indy_lint_exit=$?

    # Fix VitePress example
    log "Running VitePress linting fixes..."
    pnpm --filter @stock-charts/vitepress-example run lint:fix || vitepress_lint_exit=$?

    # Format web and vscode
    log "Formatting web code..."
    pnpm run format:web || format_exit=$?

    # Format libraries (Prettier fix)
    log "Formatting library code..."
    pnpm --filter '@facioquo/chartjs-chart-financial' run format || lib_format_exit=$?
    pnpm --filter '@facioquo/indy-charts' run format || indy_format_exit=$?

    # Fix CSS files
    log "Running CSS linting fixes..."
    pnpm run lint:css:fix || css_lint_exit=$?

    if [ "${lib_lint_exit:-0}" -ne 0 ] || [ "${indy_lint_exit:-0}" -ne 0 ] || [ "${vitepress_lint_exit:-0}" -ne 0 ] || [ "${format_exit:-0}" -ne 0 ] || [ "${lib_format_exit:-0}" -ne 0 ] || [ "${indy_format_exit:-0}" -ne 0 ] || [ "${css_lint_exit:-0}" -ne 0 ]; then
      err "Linting or formatting completed with issues (see output above)"
      # Don't exit 1 for fix mode - user can review and re-run check
    fi

    log "✅ Lint fix completed"
    exit 0
    ;;

  *)
    err "Unknown mode: $mode. Use 'check' or 'fix'."
    exit 1
    ;;
esac
