# Task 3: Build High-Level Chart Abstractions (OverlayChart, OscillatorChart, ChartManager)

## Scope & Objective

Create the main library exports: OverlayChart, OscillatorChart, and ChartManager classes that provide high-level APIs and manage Chart.js lifecycle internally.

**In scope**:

- Create `charts/` directory in library
- Implement OverlayChart class (candlestick + volume + indicators)
- Implement OscillatorChart class (indicator panels)
- Implement ChartManager class (multi-chart coordination)
- Implement dataset slicing logic for window resize
- Implement theme update methods
- Export all classes from library index

**Out of scope**:

- API client (next ticket)
- LocalStorage caching (next ticket)
- Angular app integration (later ticket)

## References

**From Analysis** (spec: [Chart System Extraction (analysis)](01-analysis.md)):

- Section 2: Risk Hotspots - "Dynamic Window Resizing Logic" (lines 646-797)
- Section 2: Risk Hotspots - "Theme Switching Without Chart Destruction"

**From Approach** (spec: [Chart System Extraction (approach)](02-approach.md)):

- Section 1: Design Decisions - "High-Level Abstraction (Opinionated API)"
- Section 1: Design Decisions - "Library Manages Dataset Slicing"
- Section 3: Component Architecture - OverlayChart, OscillatorChart, ChartManager interfaces
- Section 3: Data Flow Sequence diagram

## Guardrails

**Preserve performance invariants** (Approach §4):

- Chart initialization < 500ms for 250 bars
- Resize debounced at 150ms
- Animation disabled (`animation: false`)
- Tooltip non-intersecting

**Preserve behavioral invariants** (Approach §4):

- Candlestick colors (up=green, down=red, unchanged=gray)
- Volume bar colors match candle direction
- Extra bars padding (7 bars on right edge)
- Legend positioning (top-left with backdrop)

**State management requirements**:

- Store `allQuotes` and `currentBarCount` in OverlayChart
- Store `allProcessedDatasets` Map in ChartManager
- Maintain deep copies for efficient slicing
- Handle array properties (pointRotation, pointBackgroundColor, backgroundColor)

## Status: Complete (implementation location changed)

All three chart abstraction classes are implemented. The destination changed
from `client/src/chartjs/financial/charts/` to `libs/indy-charts/charts/`.

## Acceptance Criteria

> **Note**: Paths below reflect original plan. Actual location is `libs/indy-charts/charts/`.

- [x] `libs/indy-charts/charts/overlay-chart.ts` — `OverlayChart` class
- [x] `OverlayChart` implements: constructor, `render()`, `addIndicator()`,
      `removeIndicator()`, `setBarCount()`, `updateTheme()`, `destroy()`
- [x] `libs/indy-charts/charts/oscillator-chart.ts` — `OscillatorChart` class
- [x] `OscillatorChart` implements: constructor, `render()`, `updateTheme()`, `destroy()`
- [x] `libs/indy-charts/charts/chart-manager.ts` — `ChartManager` class
- [x] `ChartManager` implements: `initializeOverlay()`, `displaySelection()`,
      `createOscillator()`, `removeSelection()`, `setBarCount()`,
      `updateAllThemes()`, `destroy()`
- [x] Dataset slicing logic works correctly (slices price, volume, indicators consistently)
- [x] Theme switching works without destroying charts
- [x] All classes exported from `libs/indy-charts/index.ts`

## Verification Steps

1. Build library: `pnpm build:lib --workspace=@stock-charts/client`
2. Create test file demonstrating usage:

   ```typescript
   const chart = new OverlayChart(canvas, { quotes: testData });
   chart.render();
   chart.setBarCount(100);
   ```

3. Verify chart renders in test environment
4. Verify setBarCount() slices datasets correctly
5. Verify updateTheme() changes colors without destroying chart
6. Run smoke tests from Ticket #1
7. Verify no memory leaks (destroy() cleans up properly)
