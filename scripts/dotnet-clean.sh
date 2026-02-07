#!/usr/bin/env bash
set -euo pipefail

# Resolve repository root (assumes script is in scripts/)
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "Cleaning .NET project artifacts ..."

echo "→ Removing all 'bin' and 'obj' directories under ${ROOT_DIR}..."
find "$ROOT_DIR" -type d \( -name node_modules -o -name .git \) -prune -o -type d \( -name bin -o -name obj \) -print0 | while IFS= read -r -d $'\0' dir; do
  echo "  rm -rf $dir"
  rm -rf "$dir"
done

echo "→ Running 'dotnet clean' on Charts.sln..."
dotnet clean "$ROOT_DIR/Charts.sln" --verbosity minimal

echo "✅ .NET clean complete."
