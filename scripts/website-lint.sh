#!/usr/bin/env bash
set -uo pipefail

# Website lint/format wrapper script (React app, libraries, Worker, VitePress)
#
# Usage:
#   bash scripts/website-lint.sh check  # check formatting and lint
#   bash scripts/website-lint.sh fix    # fix formatting
#
# Every check runs even after an earlier one fails, so a single invocation
# reports every problem rather than only the first.

mode="${1:-check}" # "check" or "fix"

log() { printf '\n[lint] %s\n' "$*"; }
err() { printf '[error] %s\n' "$*" >&2; }

failures=()

# run <label> <command...> — runs the command, recording the label on failure.
run() {
  local label="$1"
  shift
  log "$label"
  if ! "$@"; then
    failures+=("$label")
  fi
}

# Workspaces with their own ESLint flat config, linted from their own directory
# so each package's rules (and its tsconfig) apply. Keep in sync with the
# `eslint.config.ts` files; the root config covers `scripts/` only.
eslint_packages=(
  "@facioquo/chartjs-chart-financial"
  "@facioquo/indy-charts"
  "@stock-charts/web"
  "@stock-charts/edge"
  "@stock-charts/vitepress-example"
)

# Workspaces whose formatting Prettier owns directly. The web app's formatting
# runs through the root `format:web` scripts, which also cover `.vscode`.
prettier_packages=(
  "@facioquo/chartjs-chart-financial"
  "@facioquo/indy-charts"
)

case "$mode" in
check)
  for pkg in "${eslint_packages[@]}"; do
    run "ESLint: $pkg" pnpm --filter "$pkg" run lint --max-warnings=0
  done
  run "ESLint: root scripts" pnpm run lint:scripts --max-warnings=0

  run "Prettier: web and .vscode" pnpm run format:web:check
  for pkg in "${prettier_packages[@]}"; do
    run "Prettier: $pkg" pnpm --filter "$pkg" run format:check
  done

  run "Stylelint: CSS and SCSS" pnpm run lint:css

  if [ ${#failures[@]} -gt 0 ]; then
    err "Linting or formatting issues detected in:"
    printf '  - %s\n' "${failures[@]}" >&2
    exit 1
  fi

  log "✅ Lint check passed"
  ;;

fix)
  for pkg in "${eslint_packages[@]}"; do
    run "ESLint --fix: $pkg" pnpm --filter "$pkg" run lint:fix
  done
  run "ESLint --fix: root scripts" pnpm run lint:scripts:fix

  run "Prettier --write: web and .vscode" pnpm run format:web
  for pkg in "${prettier_packages[@]}"; do
    run "Prettier --write: $pkg" pnpm --filter "$pkg" run format
  done

  run "Stylelint --fix: CSS and SCSS" pnpm run lint:css:fix

  # Fix mode never fails the command: the remaining problems are the ones a
  # human has to resolve, and `check` is what gates.
  if [ ${#failures[@]} -gt 0 ]; then
    err "Some issues remain and need manual attention in:"
    printf '  - %s\n' "${failures[@]}" >&2
  fi

  log "✅ Lint fix completed"
  ;;

*)
  err "Unknown mode: $mode. Use 'check' or 'fix'."
  exit 1
  ;;
esac
