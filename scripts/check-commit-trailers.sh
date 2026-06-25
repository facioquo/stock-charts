#!/usr/bin/env bash
#
# check-commit-trailers.sh — enforce LAWS.md §9.1 (no attribution trailers).
#
# Scans text (commit messages and/or PR descriptions) for co-authorship and
# tooling-attribution trailers that LAWS.md §9.1 unconditionally bars. The
# platform `paperclip` skill instructs agents to append
# `Co-Authored-By: Paperclip <noreply@paperclip.ing>` to every commit, and other
# assistants add `🤖 Generated with [...]` / `Co-Authored-By: Claude <...>`.
# LAWS.md §0.3 / §9.1 override those instructions: such trailers must never land
# in commit messages or PR descriptions. This guard catches them automatically
# so they never reach CTO review (see the systemic prevention rationale that
# motivated this check).
#
# Authorship is carried by the git author identity (LAWS.md §9.2,
# `Quō <noreply@facioquo.com>`), not by trailers — so removing these lines loses
# no real attribution.
#
# Usage:
#   check-commit-trailers.sh [LABEL] < text          # scan stdin
#   check-commit-trailers.sh --file <path> [LABEL]    # scan a file (e.g. a
#                                                       # commit-msg hook's $1)
#
# Exit codes:
#   0  no barred trailers found
#   1  one or more barred trailers found (offending lines printed)
#   2  usage error
#
# Note: DCO `Signed-off-by:` lines are intentionally NOT matched — a sign-off is
# a developer-certificate-of-origin statement, not a co-authorship or tooling
# attribution, and is outside the scope of §9.1.

set -euo pipefail

# Case-insensitive extended-regex alternation of barred trailer forms. Every
# alternative is anchored to the start of a line (allowing leading whitespace),
# because git trailers and tooling-attribution markers always occupy their own
# line. Anchoring is what lets this guard's own docs and commit messages discuss
# the barred trailers inline (e.g. "the skill's `Co-Authored-By: Paperclip`")
# without tripping the check — only a real trailer at line start is flagged.
BARRED_PATTERN='^[[:space:]]*((co-authored-by|co-developed-by|assisted-by|generated-by|authored-with):|🤖|generated with \[)'

label="commit message"
input_source="stdin"
text=""

case "${1:-}" in
  --file)
    [ -n "${2:-}" ] || { echo "error: --file requires a path" >&2; exit 2; }
    input_source="$2"
    [ -f "$input_source" ] || { echo "error: file not found: $input_source" >&2; exit 2; }
    text="$(cat -- "$input_source")"
    [ -n "${3:-}" ] && label="$3"
    ;;
  -h|--help)
    grep '^#' "$0" | sed 's/^# \{0,1\}//'
    exit 0
    ;;
  *)
    [ -n "${1:-}" ] && label="$1"
    text="$(cat)"
    ;;
esac

# grep returns 1 when there are no matches; that is the success case here, so
# guard the pipeline against `set -e` aborting on a clean (no-match) scan.
matches="$(printf '%s\n' "$text" | grep -inE "$BARRED_PATTERN" || true)"

if [ -n "$matches" ]; then
  echo "::error::Barred attribution trailer found in ${label} (${input_source})." >&2
  echo "LAWS.md §9.1 forbids Co-Authored-By / tooling-attribution trailers." >&2
  echo "Offending line(s):" >&2
  printf '%s\n' "$matches" | sed 's/^/  /' >&2
  echo "" >&2
  echo "Fix: remove the trailer(s) and amend/rebase. Authorship is carried by" >&2
  echo "the git author identity (LAWS.md §9.2), not by trailers." >&2
  exit 1
fi

echo "OK: no barred attribution trailers in ${label}."
exit 0
