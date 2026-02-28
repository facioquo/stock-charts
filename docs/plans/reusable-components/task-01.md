# Task 1: Add Smoke Tests for Chart Critical Paths

## Scope & Objective

Add minimal smoke tests for chart initialization, indicator lifecycle, theme switching, and dataset slicing to catch major breakage during refactoring.

**In scope**:

- Chart initialization test (OverlayChart with quotes)
- Indicator add/remove test
- Theme switch test
- Window resize/dataset slicing test

**Out of scope**:

- Comprehensive test coverage (edge cases, error handling)
- Performance testing
- Visual regression testing

## References

**From Analysis** (spec: [Chart System Extraction (analysis)](01-analysis.md)):

- Section 3: Test Coverage - "ChartService: 0% coverage, ConfigService: ~5% coverage"
- Section 2: Risk Hotspots - "Chart Initialization Flow" and "Dynamic Window Resizing Logic"

**From Approach** (spec: [Chart System Extraction (approach)](02-approach.md)):

- Section 5: Test Strategy - "Smoke Tests (Before Refactoring)"
- Target coverage: 60% for library core

## Guardrails

**Preserve existing test patterns**:

- Use Vitest (existing framework)
- Mock canvas context (pattern from file:client/src/chartjs/financial/financial.integration.spec.ts)
- Mock API calls with static data

**Test must verify**:

- Chart renders (canvas has Chart.js instance)
- Datasets exist (candlestick, volume, indicators)
- Theme colors change (sample verification)
- Dataset slicing works (bar count changes)

## Status: Complete

All four smoke tests are implemented in `client/src/app/services/chart.service.spec.ts`
under the `"ChartService Smoke Tests"` describe block.

## Acceptance Criteria

- [x] Test file created: `client/src/app/services/chart.service.spec.ts`
- [x] Test 1: Chart initialization - creates overlay chart with sample quotes
- [x] Test 2: Indicator lifecycle - adds and removes indicator dataset
- [x] Test 3: Theme switching - verifies color changes on theme update
- [x] Test 4: Dataset slicing - verifies bar count changes slice datasets correctly
- [x] All tests pass in CI
- [x] Tests use mocked dependencies (no real HTTP calls)

## Verification Steps

1. Run test suite: `pnpm test --workspace=@stock-charts/client`
2. Verify all 4 smoke tests pass
3. Verify tests run in < 5 seconds (fast feedback)
4. Verify tests don't require real backend API
5. Check test coverage report shows ChartService has basic coverage
