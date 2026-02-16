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

- Remove old file:client/src/app/services/chart.service.ts (old implementation)
- Remove old file:client/src/app/services/config.service.ts (old implementation)
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

## Acceptance Criteria

- [ ] Completed manual testing checklist (all items pass):
  - Chart loads on page load ✓
  - Default indicators display ✓
  - Add/remove indicators ✓
  - Change indicator parameters ✓
  - Theme switching ✓
  - Window resize ✓
  - LocalStorage persistence ✓
  - Fallback to backup data ✓
- [ ] Completed edge case testing (all items pass)
- [ ] Removed old ChartService implementation
- [ ] Removed old ConfigService implementation
- [ ] Removed USE_CHART_LIBRARY feature flag
- [ ] Updated all imports to use library
- [ ] All tests pass: `pnpm test:all`
- [ ] Production build succeeds: `pnpm build:prod`
- [ ] Published to npm: `@stock-charts/financial@1.0.0`
- [ ] Updated Angular app to use published package (not path mapping)

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
