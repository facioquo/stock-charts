#!/usr/bin/env bash
# Post-create setup script for the dev container

set -e

REPO_ROOT="/workspaces/stock-charts"

echo "🔧 Running post-create setup..."

# ------------------------------------------------------------------------------
# Git setup
# ------------------------------------------------------------------------------

# Remove Git LFS hooks if present (this repo doesn't use LFS)
echo "🔧 Removing Git LFS hooks (not used by this repo)..."
rm -f "${REPO_ROOT}/.git/hooks/pre-push" 2>/dev/null || true
rm -f "${REPO_ROOT}/.git/hooks/post-checkout" 2>/dev/null || true
rm -f "${REPO_ROOT}/.git/hooks/post-commit" 2>/dev/null || true
rm -f "${REPO_ROOT}/.git/hooks/post-merge" 2>/dev/null || true
if git lfs version &>/dev/null; then
  git lfs uninstall --local 2>/dev/null || true
fi

git config pull.rebase false

echo "🔐 Trusting .NET dev certificates..."
dotnet dev-certs https --trust 2>/dev/null || echo "  (dev-certs trust may require manual action on some systems)"
