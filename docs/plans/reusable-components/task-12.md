# Task 12: Finish VitePress Demonstrator and Resolve Open PR #454 Review Feedback

## Status: Complete

All acceptance criteria verified against the current repo on the `reusable-charts` branch.

## Scope & Objective

Complete the unfinished VitePress documentation/demo work for the reusable
components effort and resolve the remaining open review feedback for PR #454
("feat: Reusable charts").

This task consolidates and replaces the temporary planning notes previously kept
under `.claude/plans/compressed-scribbling-falcon.md`.

## Why this task exists

The reusable components extraction is largely implemented, but the VitePress
demonstrator site and related docs still contain fictional API examples and
incomplete polish. This undermines the primary directive of this repository:
helping developers evaluate and understand the charting capabilities quickly.

## In scope

- [x] Fix VitePress docs/snippets that reference fictional or outdated APIs
- [x] Fix VitePress home page snippets and incorrect feature claims
- [x] Update `libs/indy-charts/README.md` to match current public APIs
- [x] Harden `tests/playwright/vitepress.spec.ts` against brittle selectors/URLs
- [x] Finish basic VitePress demonstrator polish on `/examples/`
  - [x] reusable demo component
  - [x] loading/error states
  - [x] theme synchronization
  - [x] responsive styling cleanup
- [x] Clarify which examples are live demos vs code recipes

## Out of scope

- New runtime features in `@facioquo/indy-charts`
- New VitePress pages or major site IA changes
- Full live indicator demo implementation on `/examples/indicators`
- Full live multi-chart demo implementation on `/examples/multiple`
- Publishing/versioning strategy changes

## Re-inspected findings (current repo)

### Documentation/API drift — FIXED

- [x] `tests/vitepress/guide/quick-start.md` — updated to use
  `setupIndyCharts()`, `createApiClient()`, `OverlayChart`, `client.getQuotes()`
- [x] `tests/vitepress/guide/api-client.md` — updated to use
  `createApiClient()`, `client.getQuotes()`, `client.getListings()`,
  `client.getSelectionData()`
- [x] `tests/vitepress/examples/indicators.md` — uses real `ChartManager`,
  `loadStaticIndicatorData()`, correct API sequences
- [x] `tests/vitepress/examples/multiple.md` — uses real `ChartManager`,
  `createApiClient()`, `initializeOverlay()` APIs; labeled as recipe page
- [x] `tests/vitepress/index.md` — home page quick example uses
  `setupIndyCharts()`, `createApiClient()`, `OverlayChart`
- [x] `tests/vitepress/guide/index.md` — no caching/TTL claims; correct API
  feature descriptions
- [x] `tests/vitepress/README.md` — project structure matches repo; correct API
  snippets and no stale branch references
- [x] `libs/indy-charts/README.md` — uses `createApiClient()`,
  `loadStaticQuotes()`, `OverlayChart`; no fictional caching examples

### VitePress site/demo polish — FIXED

- [x] `/examples/` live overlay demo extracted into reusable `IndyOverlayDemo.vue`
  component; inline markdown implementation replaced
- [x] Demo syncs `isDarkTheme` to VitePress appearance via `useData().isDark`
- [x] Inline styles moved into `.vitepress/theme/custom.css` (`.indy-demo`,
  `.indy-demo__panel`, `.indy-demo__canvas`)
- [x] Loading/error states with stable `data-testid` hooks in both
  `IndyOverlayDemo.vue` and `IndyIndicatorsDemo.vue`
- [x] `/examples/indicators` has live `IndyIndicatorsDemo` component (not just
  recipe)
- [x] `/examples/multiple` explicitly labeled as recipe-only page
- [x] Responsive styling: canvas uses `position: absolute; inset: 0` to allow
  container to resize freely regardless of Chart.js pixel width
- [x] Dark mode defaults to `appearance: 'dark'` in `config.ts`

### Playwright test gaps — FIXED

- [x] `tests/playwright/vitepress.spec.ts` — no hardcoded `BASE` constant;
  uses relative paths with `baseURL` from Playwright config
- [x] Dark mode test uses `.VPNavBarAppearance button[role='switch']` CSS
  selector (stable, not accessible-name dependent)
- [x] Examples page tests use `getByTestId` and accept either canvas or error
  state for deterministic results regardless of API availability

### Already fixed (do not re-do)

- `libs/indy-charts/eslint.config.ts` already contains
  `@typescript-eslint/triple-slash-reference`

## Source-of-truth API references (verify against implementation)

### Setup

```typescript
import { setupIndyCharts } from "@facioquo/indy-charts";

setupIndyCharts();
```

### API client

```typescript
import { createApiClient } from "@facioquo/indy-charts";

const client = createApiClient({
  baseUrl: "https://your-api.com",
  onError: (context, error) => {
    console.error(context, error);
  }
});

const quotes = await client.getQuotes();
const listings = await client.getListings();
const rows = await client.getSelectionData(selection, listing);
```

### OverlayChart

```typescript
import { OverlayChart } from "@facioquo/indy-charts";

const chart = new OverlayChart(canvas, {
  isDarkTheme: false,
  showTooltips: true
});

chart.render(quotes);
```

### ChartManager

```typescript
import { ChartManager } from "@facioquo/indy-charts";

const manager = new ChartManager({
  settings: { isDarkTheme: false, showTooltips: true }
});

manager.initializeOverlay(ctx, quotes, 250);
manager.processSelectionData(selection, listing, indicatorRows);
manager.displaySelection(selection, listing);
manager.createOscillator(oscillatorCanvas, selection, listing);
```

### Static helpers

```typescript
import {
  loadStaticIndicatorData,
  loadStaticQuotes
} from "@facioquo/indy-charts";

const quotes = loadStaticQuotes(rawQuoteArray);
const rows = loadStaticIndicatorData(rawIndicatorArray);
```

## Files to change (expected)

- `tests/vitepress/index.md`
- `tests/vitepress/guide/index.md`
- `tests/vitepress/guide/quick-start.md`
- `tests/vitepress/guide/api-client.md`
- `tests/vitepress/examples/index.md`
- `tests/vitepress/examples/indicators.md`
- `tests/vitepress/examples/multiple.md`
- `tests/vitepress/README.md`
- `tests/playwright/vitepress.spec.ts`
- `libs/indy-charts/README.md`
- `tests/vitepress/.vitepress/config.ts` (if small config adjustments are needed)
- `tests/vitepress/.vitepress/theme/*` (new theme/component files for demo polish)

## Implementation requirements

### 1. Documentation correctness pass

Replace fictional API usage in VitePress pages and README docs with examples
that compile conceptually against current `@facioquo/indy-charts` exports.

Specific expectations:

- Prefer `setupIndyCharts()` over manual Chart.js + financial plugin setup in docs
- Use `OverlayChart` for quick-start/basic demo snippets unless `ChartManager` is
  specifically needed
- Use `createApiClient({ baseUrl, onError })` + `client.getQuotes()`
- Remove unsupported LocalStorage caching claims from public docs
- Use correct static helper signatures (`loadStaticQuotes(rawArray)`)

### 2. VitePress demonstrator finish (basic chart page)

Create a reusable VitePress component for the live overlay demo and replace the
inline markdown implementation.

Minimum behavior:

- Registers charts via `setupIndyCharts()`
- Fetches quotes via `createApiClient().getQuotes()`
- Renders `OverlayChart`
- Handles loading / success / error UI states
- Syncs chart theme to VitePress dark mode
- Cleans up chart instance on unmount
- Adds stable `data-testid` hooks for Playwright

### 3. Example page status clarity

Clearly label `/examples/indicators` and `/examples/multiple` as recipe/code
examples (not live demos yet), while keeping all code truthful.

### 4. Playwright cleanup

- Remove hardcoded `BASE`
- Use relative paths with configured `baseURL`
- Replace brittle appearance-toggle selector with a stable selector strategy
- Make `/examples/` assertions resilient to API availability by accepting either
  rendered canvas or an explicit error panel

## Acceptance Criteria

- [x] No fictional API calls remain in:
  - `tests/vitepress/**/*.md`
  - `libs/indy-charts/README.md`
- [x] VitePress home page and quick-start snippets match actual library APIs
- [x] `tests/playwright/vitepress.spec.ts` no longer uses hardcoded `BASE`
- [x] `/examples/` live demo uses a reusable VitePress component with:
  - [x] loading state
  - [x] error state
  - [x] theme sync
  - [x] cleanup on unmount
- [x] `/examples/indicators` is a live demo (`IndyIndicatorsDemo`); `/examples/multiple`
      explicitly labeled as recipe-only
- [x] `tests/vitepress/README.md` and `libs/indy-charts/README.md` are aligned to
      current APIs and repo state

## Verification Steps

1. [x] `pnpm run format:check`
2. [x] `pnpm run lint`
3. [x] `pnpm --filter @stock-charts/vitepress-example run build`
4. [x] Run VitePress Playwright tests — 11/11 content tests pass:
   - [x] home page nav/title tests pass
   - [x] appearance toggle test passes with `.VPNavBarAppearance button[role='switch']` selector
   - [x] `/examples/` test passes with `data-testid` selectors accepting canvas or error state
5. [x] Manual visual QA confirmed (screenshots at 1280px and 640px):
   - [x] `/examples/` dark mode (default via `appearance: 'dark'`)
   - [x] `/examples/` responsive resize (chart fills container without overflow)

## Notes / follow-up options

- If you later want live `/examples/indicators` or `/examples/multiple` demos,
  create separate task files rather than expanding this remediation task
  indefinitely.
- If caching is reintroduced as a library feature, update Task 4 and the README
  docs in a dedicated change so plan history stays accurate.
