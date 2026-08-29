# Changesets

This directory holds pending release notes for `@facioquo/indy-charts`, the one
published package in this workspace. Every other package is `private`, and
`privatePackages.version` is `false`, so none of them is versioned or tagged.

## Adding a changeset

Run this from the repository root in the same pull request as the change:

```bash
pnpm changeset
```

Pick `@facioquo/indy-charts`, choose the bump, and write the summary a consumer
of the package will read. Commit the generated `.changeset/*.md` file with your
other changes.

## When a changeset is required

| Change | Changeset |
| --- | --- |
| New export or feature in `libs/indy-charts` | Yes — `minor` |
| Bug fix in `libs/indy-charts` | Yes — `patch` |
| Breaking API change in `libs/indy-charts` | Yes — `major` |
| Anything in `web/`, `server/`, `tests/`, or CI | No |
| Internal refactor of `libs/indy-charts` with no consumer-visible effect | No |

`libs/chartjs-financial` is private and bundled into the `indy-charts` dist, so
a change there that consumers can observe is described in the `indy-charts`
changeset rather than getting one of its own.

## How a release happens

1. Pull requests merge to `main` carrying their changeset files.
2. The release workflow opens (or updates) a **Version Packages** pull request
   that consumes them, bumps the version, and writes `CHANGELOG.md`.
3. Its CI starts in an approval-required state, because a workflow opened it.
   Press **Approve and run** on that pull request's Actions tab so the required
   `lint-and-test` check reports.
4. Merging that pull request publishes to GitHub Packages.

Step 3 is expected, not a fault: GitHub holds CI for pull requests opened by a
workflow. If the check never appears at all, close and reopen the pull request.

Do not hand-edit a merged changeset file or the generated Version Packages pull
request — add another changeset and let the workflow regenerate it.
