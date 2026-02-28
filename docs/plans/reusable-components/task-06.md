# Task 6: Integrate Library into Angular App with Feature Flag

## Scope & Objective

Update Angular app to use the library via TypeScript path mapping, implement feature flag to toggle between old and new implementations, and validate both code paths work.

**In scope**:

- Add TypeScript path mapping for `@stock-charts/financial`
- Create feature flag `USE_CHART_LIBRARY` in environment config
- Create new ChartService implementation using library classes
- Update components to use feature flag
- Keep old ChartService code for parallel validation

**Out of scope**:

- Removing old code (next ticket after validation)
- VitePress integration (separate concern)
- Production deployment

## References

**From Analysis** (spec: [Chart System Extraction (analysis)](01-analysis.md)):

- Section 1: API Boundaries - "ChartService public interface"
- Section 4: Change Surface Area - "3 Angular components, 2 services, 1 bootstrap file"

**From Approach** (spec: [Chart System Extraction (approach)](02-approach.md)):

- Section 1: Transition Decisions - "Big-Bang with Feature Flag"
- Section 1: Design Decisions - "Angular Services → Library Classes Mapping"

## Guardrails

**Preserve public API** (Approach §4):

- ChartComponent still calls `cht.loadCharts()`
- SettingsComponent still calls `cht.deleteSelection()`, `cht.onSettingsChange()`
- PickConfigComponent still adds selections
- All existing component code works unchanged

**Feature flag implementation**:

- Flag in file:client/src/environments/environment.ts and `environment.prod.ts`
- Default to `false` (old code) initially
- Easy to flip for testing
- Both code paths must compile and run

**Watch for risk hotspots** (Analysis §2):

- Chart initialization sequence (must match current flow)
- Theme switching (global state mutation)
- LocalStorage serialization (format compatibility)

## Status: Complete (approach evolved — no feature flag; direct workspace integration)

The Angular app integrates the libraries via pnpm workspace resolution (no
TypeScript path mapping aliases needed). The feature-flag parallel code path
approach was not used; the Angular services were updated in-place to import from
`@facioquo/chartjs-chart-financial`. `ConfigService` and `ChartService` remain
as Angular services and were not replaced by `ChartManager`.

## Acceptance Criteria

- [ ] TypeScript path mapping in `tsconfig.json` — **not needed; pnpm workspace
      resolution handles `@facioquo/` imports directly**
- [ ] `USE_CHART_LIBRARY` feature flag — **not implemented; approach was dropped**
- [ ] `ChartService` rewritten to use `ChartManager` — **not done; `ChartService`
      was updated in-place to import builders from `@facioquo/chartjs-chart-financial`**
- [x] Angular app imports from `@facioquo/chartjs-chart-financial` (financial
      primitives: datasets, options, colors, types)
- [x] Old `ChartService` and `ConfigService` retained and updated (not replaced)
- [x] App compiles and builds successfully with library imports
- [ ] Dual code-path validation (old vs new) — **not applicable; single updated path**

## Verification Steps

1. **Test with old implementation** (`USE_CHART_LIBRARY = false`):
   - Run dev server: `pnpm start`
   - Verify charts load
   - Verify all manual testing checklist items (from Approach §5)

2. **Test with new implementation** (`USE_CHART_LIBRARY = true`):
   - Flip feature flag
   - Run dev server: `pnpm start`
   - Verify charts load
   - Verify all manual testing checklist items (from Approach §5)

3. **Compare behaviors**:
   - Chart appearance identical
   - Indicator functionality identical
   - Theme switching identical
   - Window resize identical
   - LocalStorage persistence identical

4. Run test suite: `pnpm test --workspace=@stock-charts/client`
5. Run production build: `pnpm build:prod --workspace=@stock-charts/client`
6. Verify both builds succeed
