# What to do next

Stock Charts is the showcase for FacioQuo.Stock.Indicators; this scan looks for engineering work that makes the showcase more trustworthy and cheaper to keep in step with the library.

## Summary

Scanned the Web API (`server/WebApi`), the edge Worker, the React app (`web/`), the `indy-charts` and `chartjs-financial` libraries, the test projects, and CI. Health is good: no TODO or FIXME markers, broad unit and contract tests, and a guard that every catalog endpoint has a route. The largest finding is that the hand-written indicator catalog has drifted from the catalog the library itself ships: 19 parameter ranges are wider than the library's own bounds, and at least one (CHOP's lookback of 1) lets a visitor pick a value the library rejects.

**Tech stack detected:** C# on .NET 10 (ASP.NET Core Web API, xUnit v3), TypeScript 6 (React 19, React Router 7, Vite 8, Vitest, Vue for the VitePress host), Chart.js 4, Cloudflare Workers and R2, pnpm workspaces, Playwright. **Analysis date:** 2026-10-22 **Candidates scored:** 10

## Candidate scoring

| # | Improvement | BV | TC | RR | DV | JS | WSJF |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Show a recoverable error screen when a route fails to load | 5 | 4 | 6 | 2 | 1 | 17.0 |
| 2 | Hold frontend and library coverage at its current level | 2 | 2 | 5 | 4 | 1 | 13.0 |
| 3 | Keep catalog parameter ranges inside what the library accepts | 7 | 5 | 7 | 4 | 2 | 11.5 |
| 4 | State the current Vite version in AGENTS.md | 2 | 1 | 2 | 3 | 1 | 8.0 |
| 5 | Run an automated accessibility check in the end-to-end suite | 5 | 2 | 4 | 2 | 2 | 6.5 |
| 6 | Send a valid, stable validator on the catalog response | 2 | 1 | 2 | 1 | 1 | 6.0 |
| 7 | Return problem details for API errors | 3 | 2 | 5 | 3 | 3 | 4.3 |
| 8 | Build catalog parameters from the library's own catalog | 8 | 3 | 6 | 7 | 6 | 4.0 |
| 9 | Upgrade to TypeScript 7 | 3 | 3 | 3 | 6 | 4 | 3.8 |
| 10 | Anchor VWAP to the first visible bar (#491, part 1) | 4 | 2 | 2 | 1 | 4 | 2.3 |

> BV = Business Value · TC = Time Criticality · RR = Risk Reduction · DV = Developer Velocity · JS = Job Size (effort; lower → smaller task)

**Quick wins** (JS = 1, BV+TC+RR ≥ 15): Show a recoverable error screen when a route fails to load

---

### Phase 1: Immediate improvements 🤖 AGENT READY

**Goal**: Address highest-WSJF automatable items.

Phase 1 takes the top three automatable items plus a one-line doc fix. It has no architecture task. The one architecture candidate, building catalog parameters from the library's catalog (#8), changes defaults a visitor sees and the offline snapshot, so it sits in Phase 2. Task 3 here is the guard that makes #8 safe to do later.

- [ ] Show a recoverable error screen when a route fails to load (WSJF: 17.0)
  - **Files:** `web/src/router.tsx`, `web/src/pages/`, `web/src/router.spec.tsx` (new)
  - **Action:** Add a route `errorElement` with a reload; today a stale lazy chunk after a deploy shows React Router's default error screen.
  - **Verification:** A unit test renders the router with a chart page import that rejects and finds the reload control; `pnpm run test:all` passes.
  - **Dependencies:** none

- [ ] Hold frontend and library coverage at its current level (WSJF: 13.0)
  - **Files:** `web/vitest.config.ts`, `libs/indy-charts/vitest.config.ts`
  - **Action:** Measure line and branch coverage for web and indy-charts and set Vitest `coverage.thresholds` just under it, so a drop fails CI.
  - **Verification:** `pnpm run test:coverage` and `vitest run --coverage` in indy-charts pass; a threshold above the measured value fails them.
  - **Dependencies:** none. Vitest config counts as build configuration in AGENTS.md, so name the change in the pull request.

- [ ] Keep catalog parameter ranges inside what the library accepts (WSJF: 11.5)
  - **Files:** `server/WebApi/Services/Service.Metadata.cs`, `server/WebApi.Tests/Services/CatalogLibraryParityTests.cs` (new), `web/public/data/chart-api/`
  - **Action:** Clamp the 19 looser ranges to `Catalog.Get()` bounds and add a test that fails when a listing's range or parameter set leaves the library's.
  - **Verification:** The new test passes and fails on a widened range; CHOP no longer offers a lookback of 1, which the library rejects with a 400.
  - **Dependencies:** none. Leave defaults alone; the 11 that differ from the library are display choices for task #8.

- [ ] State the current Vite version in AGENTS.md (WSJF: 8.0)
  - **Files:** `AGENTS.md`
  - **Action:** Change "Vite v7" to "Vite v8" in the conventions and frontend architecture lists, matching `web/package.json`.
  - **Verification:** `pnpm run lint:md` passes; the stated version matches `web/package.json`.
  - **Dependencies:** none. Ranked fourth, but too small to wait; it can ride along with any of the three above.

---

### Phase 2: Collaborative work 🔄 PAIR PROGRAMMING

**Goal**: Address high-value items requiring human–agent collaboration.

- [ ] Send a valid, stable validator on the catalog response (WSJF: 6.0)
  - **Files:** `server/WebApi/Endpoints.cs`, `.github/workflows/deploy-website.yml`, `server/WebApi.Tests/Endpoints/MainEndpointsTests.cs`
  - **Action:** Quote the deploy-stamped ETag and drop the per-request `Last-Modified`, which changes on every call and so validates nothing.
  - **Verification:** A test asserts a quoted ETag; a conditional request through the Worker returns 304 or a cache hit.
  - **Dependencies:** Deploy workflow change, so it waits for a maintainer's go-ahead.

- [ ] Return problem details for API errors (WSJF: 4.3)
  - **Files:** `server/WebApi/Program.cs`, `server/WebApi/Endpoints.cs`, `libs/indy-charts/backing-api.yml`, `libs/indy-charts/api/client.ts`
  - **Action:** Add `AddProblemDetails` and an exception handler, and return RFC 9457 bodies for 400 and 503 instead of plain strings.
  - **Verification:** Endpoint tests assert `application/problem+json`; `backing-api.spec.ts` and `lint:openapi` pass with the contract updated.
  - **Dependencies:** Changes the published `backing-api.yml` error shape, so it needs a changeset and a maintainer's call on compatibility.

- [ ] Build catalog parameters from the library's own catalog (WSJF: 4.0)
  - **Files:** `server/WebApi/Services/Service.Metadata.cs`, `server/WebApi/Models/`, `web/public/data/chart-api/`
  - **Action:** Read names, parameters, defaults, and ranges from `Catalog.Get()`; keep only colors, legends, and line styles in the local overlay.
  - **Verification:** Catalog and offline snapshot tests pass; the parity test from Phase 1 becomes redundant and is removed.
  - **Dependencies:** Phase 1 parity test. A maintainer picks whose defaults win where the two differ (SMA 10 or 20, for example).

- [ ] Upgrade to TypeScript 7 (WSJF: 3.8)
  - **Files:** `package.json`, `web/package.json`, `server/edge/package.json`, `libs/*/package.json`, `tsconfig*.json`
  - **Action:** Move from 6.0 to 7.0 once typescript-eslint supports it, and adopt the release's recommended compiler options.
  - **Verification:** `pnpm run typecheck`, `pnpm run lint`, `pnpm run build`, and `pnpm run test:all` pass; the pull request lists what was modernized.
  - **Dependencies:** typescript-eslint support for TypeScript 7.

- [ ] Anchor VWAP to the first visible bar (#491, part 1) (WSJF: 2.3)
  - **Files:** `server/WebApi/Endpoints.cs`, `libs/indy-charts/api/client.ts`, `libs/indy-charts/backing-api.yml`, `web/src/charting/`
  - **Action:** Accept a `startDate` on `GET /VWAP` and have the client pass the first visible bar's timestamp for its current bar count.
  - **Verification:** Endpoint tests cover the new parameter; at a narrow viewport the leftmost VWAP point equals that bar's typical price.
  - **Dependencies:** Adds a parameter to the published contract, so it needs a changeset.

---

### Phase 3: Human-led decisions 🙋 HUMAN REQUIRED

**Goal**: Items requiring external coordination or business decisions.

- [ ] Run an automated accessibility check in the end-to-end suite (WSJF: 6.5)
  - **Files:** `tests/playwright/package.json`, `tests/playwright/react-web.spec.ts`, `tests/playwright/vitepress.spec.ts`
  - **Action:** Add `@axe-core/playwright` and assert no serious or critical violations on the chart page and the docs examples.
  - **Verification:** `pnpm run test:e2e` passes with the scan in place, and fails when a violation is introduced.
  - **Dependencies:** A new npm dependency, which AGENTS.md asks a maintainer to approve first.

---

## Implementation complete

- [ ] Show a recoverable error screen when a route fails to load
- [ ] Hold frontend and library coverage at its current level
- [ ] Keep catalog parameter ranges inside what the library accepts
- [ ] State the current Vite version in AGENTS.md
- [ ] Send a valid, stable validator on the catalog response
- [ ] Return problem details for API errors
- [ ] Build catalog parameters from the library's own catalog
- [ ] Upgrade to TypeScript 7
- [ ] Anchor VWAP to the first visible bar (#491, part 1)
- [ ] Run an automated accessibility check in the end-to-end suite

## Change log

<!-- First run: no previous plan to compare against. -->
