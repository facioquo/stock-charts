# Task 8: Validate, Remove Old Code, and Publish Library

## Scope & Objective

Complete final validation of library implementation, remove old Angular code, flip feature flag permanently, and publish library to npm.

**In scope**:

- Run comprehensive manual testing (all checklist items)
- Remove old ChartService and ConfigService implementations
- Remove feature flag (set to true permanently)
- Clean up unused imports and dependencies
- Publish `@stock-charts/financial` to npm
- Update Angular app to use published package

**Out of scope**:

- New features or enhancements
- Performance optimizations beyond current state
- Additional documentation

## References

**From Analysis** (spec: [Chart System Extraction (analysis)](01-analysis.md)):

- Section 4: Change Surface Area - "Files requiring updates"

**From Approach** (spec: [Chart System Extraction (approach)](02-approach.md)):

- Section 5: Test Strategy - "Manual Testing Checklist"
- Section 1: Transition Decisions - "Remove old code and feature flag once validated"

## Guardrails

**Validation requirements** (Approach §5):

- All critical paths tested manually
- All edge cases verified
- Performance characteristics maintained
- No regressions in functionality

**Code cleanup**:

- Remove old file client/src/app/services/chart.service.ts (old implementation)
- Remove old file client/src/app/services/config.service.ts (old implementation)
- Remove feature flag from environment files
- Remove unused imports
- Update tests to use library

**Publishing checklist**:

- Version set to 1.0.0
- README.md complete
- LICENSE file present
- Package builds successfully
- Package size reasonable
- npm credentials configured

## Status: Superseded / Not fully executed

This task as originally written assumed npm publishing and complete removal of
Angular services. Neither happened: libraries remain `private: true` at `v0.1.0`
and are consumed via workspace linking. Angular services were updated in-place
(not removed). Task 12 handled the PR and quality pass instead.

## Acceptance Criteria

- [x] Chart loads on page load
- [x] Default indicators display
- [x] Add/remove indicators
- [x] Change indicator parameters
- [x] Theme switching
- [x] Window resize
- [ ] LocalStorage persistence — **caching not implemented (see Task 4)**
- [x] Fallback to backup data
- [ ] Removed old `ChartService` implementation — **retained and updated in-place**
- [ ] Removed old `ConfigService` implementation — **retained and updated in-place**
- [ ] Removed `USE_CHART_LIBRARY` feature flag — **never added (feature flag
      approach was not pursued)**
- [x] Updated Angular app imports to use `@facioquo/chartjs-chart-financial`
- [x] All tests pass: `pnpm test:all`
- [x] Production build succeeds: `pnpm build:prod`
- [ ] Published to npm — **not done; packages are `private: true` at `v0.1.0`**
- [ ] Angular app uses published package — **uses workspace linking, not published npm**

## Verification Steps

1. Run full test suite: `pnpm test:all`
2. Run production build: `pnpm build:prod --workspace=@stock-charts/client`
3. Start production build locally and test
4. Verify no console errors
5. Verify no TypeScript errors
6. Publish to npm: `pnpm publish --workspace=@stock-charts/financial`
7. Install published package in Angular app
8. Verify app works with published package
9. Test in VitePress (Stock.Indicators repo)
10. Verify VitePress examples work with published package
