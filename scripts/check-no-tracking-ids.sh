#!/usr/bin/env bash
#
# Guard: no internal Paperclip tracking identifiers anywhere in committed files.
# Internal issue IDs are internal-only information and must never live in code,
# comments, test labels, docs, fixtures, or infra manifests (board coding
# standard; LAWS.md §5.3 — internal-information protection; §5.5 — no tracker
# IDs in repository artifacts).
#
# Pattern: the Paperclip "FAC" tracker prefix followed by an issue number
# (e.g. the four-digit issue numbers used by this org). Word-boundary anchored
# so unrelated architecture references (ADR-0001), standards (RFC-8707, UTF-8),
# and crypto names (AES-256) are NOT matched — only "FAC-<number>".
#
# Scope: the entire tracked tree. Generated lock files are excluded because
# they are machine-authored and cannot carry intentional tracking references.
#
# Exit 0 = clean; exit 1 = at least one identifier found (build should fail).

set -euo pipefail

# Internal tracker prefix(es) to forbid. Word-boundary anchored so it does not
# match unrelated tokens (e.g. "ARTIFACT-1" or "ADR-0001").
pattern='\bFAC-[0-9]+\b'

# All tracked files except generated dependency lock files and any build/vendor
# output (excluded defensively even though it is normally untracked).
mapfile -t files < <(git ls-files \
  | grep -vE '(^|/)(pnpm-lock\.yaml|package-lock\.json)$' \
  | grep -vE '/(node_modules|dist|build|coverage)/' || true)

if [ "${#files[@]}" -eq 0 ]; then
  echo "check-no-tracking-ids: no tracked files to scan."
  exit 0
fi

# Stream the file list NUL-delimited through xargs so the scan stays correct on
# large trees that would otherwise exceed ARG_MAX in a single grep call. We test
# the captured output for non-emptiness rather than the pipeline exit code:
# xargs may split the list across several grep calls, and grep's per-call
# "no match" (exit 1) would make exit-code aggregation unreliable across batches.
matches=$(printf '%s\0' "${files[@]}" | xargs -0 -r grep -nEH "$pattern" || true)
if [ -n "$matches" ]; then
  {
    echo "ERROR: internal tracking identifier(s) found in committed files."
    echo "Remove FAC-<number> references from code, comments, docs, and labels"
    echo "(board coding standard; LAWS.md §5.3, §5.5). Offending locations:"
    echo
    echo "$matches"
  } >&2
  exit 1
fi

echo "check-no-tracking-ids: OK — no FAC-<number> identifiers in tracked files."
