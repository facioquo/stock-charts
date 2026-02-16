# Task 2: Extract Chart Configuration and Data Transformation to Library

## Scope & Objective

Extract ConfigService methods and ChartService data transformation logic into framework-agnostic pure functions within the library package.

**In scope**:

- Create `config/` directory in library with pure configuration builders
- Create `data/` directory in library with data transformers
- Extract all ConfigService methods as pure functions (no Angular DI)
- Extract ChartService data processing methods (processQuoteData, buildDataPoints, etc.)
- Convert UserService dependency to parameter-based configuration

**Out of scope**:

- High-level abstractions (OverlayChart, OscillatorChart) - next ticket
- Angular app updates - later ticket
- API client implementation - later ticket

## References

**From Analysis** (spec: [Chart System Extraction (analysis)](01-analysis.md)):

- Section 1: Dependencies - "ConfigService Dependencies: UserService (isDarkTheme, showTooltips)"
- Section 4: Change Surface Area - "ConfigService (~400 lines), ChartService data transformers"

**From Approach** (spec: [Chart System Extraction (approach)](02-approach.md)):

- Section 1: Structure Decisions - "Replace Angular service injection with parameter-based configuration"
- Section 3: Component Architecture - Core interfaces (ChartSettings, OverlayChartConfig, etc.)

## Guardrails

**Preserve behavioral invariants** (Approach §4):

- Y-axis formatting (dollar signs for price, K/M/B for oscillators)
- X-axis time series behavior (daily candles)
- Dataset line types (solid, dash, dots, bar, pointer, none)
- Legend annotation positioning

**Watch for risk hotspots** (Analysis §2):

- Candlestick pattern point configuration (special rotation/color logic)
- Extra bars padding logic (7 bars on right edge)

**Pure function requirements**:

- No Angular dependency injection
- Accept settings as parameters
- No side effects (no DOM manipulation, no global state mutation)
- Return Chart.js configuration objects

## Acceptance Criteria

- [ ] Created client/src/chartjs/financial/config/types.ts with ChartSettings, OverlayChartConfig, OscillatorChartConfig interfaces
- [ ] Created client/src/chartjs/financial/config/common.ts with baseChartOptions(), defaultXAxisOptions()
- [ ] Created client/src/chartjs/financial/config/overlay.ts with baseOverlayConfig(), baseOverlayOptions()
- [ ] Created client/src/chartjs/financial/config/oscillator.ts with baseOscillatorConfig(), baseOscillatorOptions()
- [ ] Created client/src/chartjs/financial/config/datasets.ts with baseDataset() supporting all 6 line types
- [ ] Created client/src/chartjs/financial/config/annotations.ts with commonLegendAnnotation()
- [ ] Created client/src/chartjs/financial/data/transformers.ts with processQuoteData(), buildDataPoints(), addExtraBars(), getCandlePointConfiguration()
- [ ] All functions are pure (no DI, no side effects)
- [ ] Existing ConfigService tests still pass (using old implementation)

## Verification Steps

1. Build library: `pnpm build:lib --workspace=@stock-charts/client`
2. Verify TypeScript compilation succeeds
3. Verify no Angular imports in extracted files
4. Run existing tests: `pnpm test --workspace=@stock-charts/client`
5. Verify ConfigService.spec.ts still passes
6. Manually verify extracted functions match original behavior (compare outputs)
