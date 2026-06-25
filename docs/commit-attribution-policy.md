# Commit attribution policy

This repository enforces the organization's agent laws (`facioquo/management`:`LAWS.md`), [section 9.1](https://github.com/facioquo/management/blob/main/LAWS.md) — **no co-authorship or tooling-attribution trailers** in commit messages or pull request descriptions.

## What is barred

Per LAWS.md §9.1, commit messages and PR descriptions SHALL NOT contain:

- `Co-Authored-By:` (or `Co-authored-by:`) trailers — any co-author trailer
- Tooling-attribution lines such as `🤖 Generated with [Claude Code](...)`
- Equivalent `Co-Developed-By:`, `Assisted-By:`, `Generated-By:`, `Authored-With:` trailers

Authorship is carried by the git author identity (LAWS.md §9.2 — `Quō <noreply@facioquo.com>`), **not** by trailers. Removing these lines loses no real attribution.

> A DCO `Signed-off-by:` line is **not** an attribution trailer and is not barred by §9.1; the guard deliberately ignores it.

## Standing guidance — the `paperclip` skill is overridden here

The platform **`paperclip` skill instructs agents to append `Co-Authored-By: Paperclip <noreply@paperclip.ing>` to every commit.** That instruction is **overridden by LAWS.md §0.3 / §9.1 and MUST NOT be followed.** LAWS.md is hierarchically superior to skill definitions; do not add the Paperclip trailer (or any assistant's trailer) even though the skill says to. If your tooling auto-adds one, remove it before committing (LAWS.md §9.1).

This conflict is systemic, not per-PR: every agent following the `paperclip` skill will otherwise keep adding the barred trailer. The override is documented here so it is explicit, not rediscovered per incident.

## How it is enforced

| Layer | Mechanism | Effect |
| --- | --- | --- |
| CI (durable) | [`.github/workflows/commit-trailer-guard.yml`](../.github/workflows/commit-trailer-guard.yml) | Fails the PR check if any PR commit message or the PR description carries a barred trailer — before review. |
| Local (optional) | [`scripts/hooks/commit-msg`](../scripts/hooks/commit-msg) template | Rejects the commit locally before it is ever created. |
| Shared logic | [`scripts/check-commit-trailers.sh`](../scripts/check-commit-trailers.sh) | Single scanner used by both layers (DRY). |

### Enable the local hook (optional)

```bash
ln -sf ../../scripts/hooks/commit-msg .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg
```

## If the guard fails

1. Identify the offending commit(s) from the check output.
2. Remove the trailer line(s): `git rebase -i` (reword) or `git commit --amend` for the tip commit, then force-push the branch.
3. For a barred trailer in the PR description, edit the PR body to remove it.
