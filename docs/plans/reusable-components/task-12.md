# Task 12: Finish VitePress Demonstrator and Resolve Open PR #454 Review Feedback

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

- Fix VitePress docs/snippets that reference fictional or outdated APIs
- Fix VitePress home page snippets and incorrect feature claims
- Update `libs/indy-charts/README.md` to match current public APIs
- Harden `tests/playwright/vitepress.spec.ts` against brittle selectors/URLs
- Finish basic VitePress demonstrator polish on `/examples/`
  - reusable demo component
  - loading/error states
  - theme synchronization
  - responsive styling cleanup
- Clarify which examples are live demos vs code recipes

## Out of scope

- New runtime features in `@facioquo/indy-charts`
- New VitePress pages or major site IA changes
- Full live indicator demo implementation on `/examples/indicators`
- Full live multi-chart demo implementation on `/examples/multiple`
- Publishing/versioning strategy changes

## Re-inspected findings (current repo)

### Documentation/API drift still present

- `tests/vitepress/guide/quick-start.md`
  - Uses fictional `ChartManager` constructor and methods
  - Uses `loadStaticQuotes("AAPL")` (wrong signature)
- `tests/vitepress/guide/api-client.md`
  - Uses fictional `fetchQuotes()` and `new ApiClient(...)`
- `tests/vitepress/examples/indicators.md`
  - Uses fictional indicator loader signatures and render methods
- `tests/vitepress/examples/multiple.md`
  - Uses unsupported multi-symbol/static-loader string API and sync methods
- `tests/vitepress/index.md`
  - Home page quick example is fictional (`ChartManager`, `loadQuotes`, manual registration)
- `tests/vitepress/guide/index.md`
  - Claims LocalStorage caching / TTL not present in current `libs/indy-charts` API client
- `tests/vitepress/README.md`
  - Stale snippets/placeholders/branch references
- `libs/indy-charts/README.md`
  - Contains fictional API/caching examples and stale signatures

### VitePress site/demo polish gaps

- `/examples/` has a live overlay demo, but implementation is inline in markdown
- Demo currently hardcodes `isDarkTheme: false` and does not sync with VitePress appearance
- Demo uses inline styles that should move into VitePress theme/component styling
- Error handling exists but UX/test hooks are limited
- No reusable component abstraction for the demo widget
- `/examples/indicators` and `/examples/multiple` function as code recipe pages, not live demos (should be explicitly labeled)

### Playwright test gaps

- `tests/playwright/vitepress.spec.ts` uses a hardcoded `BASE` constant instead of configured `baseURL`
- Dark mode test targets an accessible name that VitePress default appearance switch may not expose reliably
- Examples page test should allow deterministic success whether API is up (canvas renders) or down (error panel renders)

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
import { loadStaticIndicatorData, loadStaticQuotes } from "@facioquo/indy-charts";

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

- [ ] No fictional API calls remain in:
  - `tests/vitepress/**/*.md`
  - `libs/indy-charts/README.md`
- [ ] VitePress home page and quick-start snippets match actual library APIs
- [ ] `tests/playwright/vitepress.spec.ts` no longer uses hardcoded `BASE`
- [ ] `/examples/` live demo uses a reusable VitePress component with:
  - loading state
  - error state
  - theme sync
  - cleanup on unmount
- [ ] `/examples/indicators` and `/examples/multiple` explicitly communicate
  recipe-only status (unless upgraded to live demos in the same pass)
- [ ] `tests/vitepress/README.md` and `libs/indy-charts/README.md` are aligned to
  current APIs and repo state

## Verification Steps

1. `pnpm run format:check`
2. `pnpm run lint`
3. `pnpm --filter @stock-charts/vitepress-example run build`
4. Run VitePress Playwright tests (repo-standard command) and verify:
   - home page nav/title tests pass
   - appearance toggle test passes with updated selector
   - `/examples/` test passes in API-up and API-down conditions (deterministic selector logic)
5. Manual visual QA:
   - `/examples/` light mode
   - `/examples/` dark mode
   - mobile width layout

## Notes / follow-up options

- If you later want live `/examples/indicators` or `/examples/multiple` demos,
  create separate task files rather than expanding this remediation task
  indefinitely.
- If caching is reintroduced as a library feature, update Task 4 and the README
  docs in a dedicated change so plan history stays accurate.
