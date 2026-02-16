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

## Acceptance Criteria

- [ ] Updated file:client/tsconfig.json with path mapping: `"@stock-charts/financial": ["./src/chartjs/financial/index.ts"]`
- [ ] Added `USE_CHART_LIBRARY` flag to environment files
- [ ] Created new ChartService implementation using library:
  - Uses `ChartManager` instead of direct Chart.js
  - Uses `createApiClient()` for data fetching
  - Delegates to library for all chart operations
- [ ] Updated file:client/src/main.ts to import from `@stock-charts/financial`
- [ ] Components work with both old and new implementations
- [ ] Old code still present (not removed yet)
- [ ] Both code paths compile successfully

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
