# Analysis: Chart System Extraction

## 1. Dependency Map

### Direct Callers (Angular Components)

**ChartComponent** (file:client/src/app/pages/chart/chart.component.ts)

- Injects `ChartService`
- Calls `cht.loadCharts()` on initialization
- **Impact**: Main entry point for chart rendering

**SettingsComponent** (file:client/src/app/components/picker/settings.component.ts)

- Injects `ChartService` and `UserService`
- Calls `cht.deleteSelection()`, `cht.onSettingsChange()`
- Accesses `cht.listings` for indicator catalog
- **Impact**: User settings and indicator management

**PickConfigComponent** (file:client/src/app/components/picker/pick-config.component.ts)

- Injects `ChartService`
- Adds new indicator selections
- **Impact**: Indicator configuration UI

### Dependencies (What Chart Code Calls)

**ChartService Dependencies**:

- `ApiService` - fetches quotes and indicator data (HTTP calls)
- `ChartConfigService` - generates Chart.js configurations
- `UserService` - theme and tooltip settings
- `UtilityService` - GUID generation, scroll utilities
- `WindowService` - resize events, optimal bar count calculation
- Chart.js library - chart rendering
- Financial plugin (file:client/src/chartjs/financial/) - candlestick/OHLC controllers

**ConfigService Dependencies**:

- `UserService` - `isDarkTheme`, `showTooltips` settings
- Chart.js types - configuration interfaces
- chartjs-plugin-annotation - legend annotations

**Financial Plugin Dependencies**:

- Chart.js v4.5+ (peer dependency)
- chartjs-adapter-date-fns (time series support)
- date-fns/locale (date formatting)

### Shared State & Side Effects

**LocalStorage Usage**:

- `ChartService.cacheSelections()` - stores indicator selections
- `ChartService.loadSelections()` - retrieves cached selections
- `UserService.cacheSettings()` - stores theme/tooltip preferences

**DOM Manipulation**:

- `ChartService.createOscillatorChart()` - creates canvas elements dynamically
- `ChartService.deleteSelection()` - removes DOM containers
- Chart.js instances - manage canvas rendering

**Global State**:

- `Chart.defaults.elements.candlestick` - theme colors applied globally
- Window resize listener in `WindowService`

### API Boundaries

**Public Interfaces (Used by Angular Components)**:

```typescript
// ChartService
loadCharts(): void
addSelection(selection, listing, scrollToMe): Observable<void>
deleteSelection(ucid: string): void
onSettingsChange(): void
listings: IndicatorListing[]
selections: IndicatorSelection[]
loading: Signal<boolean>

// ConfigService
baseOverlayConfig(volumeAxisSize): ChartConfiguration
baseOscillatorConfig(): ChartConfiguration
baseDataset(result, resultConfig): ChartDataset
commonLegendAnnotation(...): AnnotationOptions
```

**Financial Plugin Exports** (file:client/src/chartjs/financial/index.ts):

```typescript
registerFinancialCharts(): void
buildCandlestickDataset(priceData, borderColor): ChartDataset
buildVolumeDataset(quotes, extraBars, palette): ChartDataset
applyFinancialElementTheme(palette): void
getFinancialPalette(mode): FinancialPalette
```

## 2. Risk Hotspots

### Critical Path: Chart Initialization Flow

**Risk Level: HIGH**

The chart initialization sequence is complex and order-dependent:

1. `ChartComponent.ngOnInit()` → `ChartService.loadCharts()`
2. Fetch quotes from API (with fallback to backup data)
3. Process quotes → create candlestick + volume datasets
4. Create overlay chart with Chart.js
5. Fetch indicator listings
6. Load cached selections or defaults
7. For each selection: fetch data → process → add to chart

**Why risky**: Breaking this sequence will prevent charts from rendering. The flow involves async operations, data transformations, and Chart.js lifecycle management.

### Dynamic Window Resizing Logic

**Risk Level: MEDIUM-HIGH**

Lines 646-797 in file:client/src/app/services/chart.service.ts:

- Listens to window resize events (debounced 150ms)
- Recalculates optimal bar count based on window width
- Slices all datasets (quotes + indicators) to new bar count
- Updates Chart.js instances with sliced data
- Manages deep copies of "full" datasets vs "displayed" datasets

**Why risky**:

- Complex state management (allQuotes, allProcessedDatasets Map)
- Dataset slicing must maintain consistency across price/volume/indicators
- Array properties (pointRotation, pointBackgroundColor) must be sliced too
- Performance-sensitive (runs on every resize)

### Theme Switching Without Chart Destruction

**Risk Level: MEDIUM**

`ChartService.onSettingsChange()` (lines 603-643):

- Updates Chart.js global defaults for candlestick colors
- Replaces chart options without destroying charts
- Regenerates legends with new theme colors

**Why risky**: Mutates global Chart.js state. Must coordinate between financial plugin theme application and ConfigService option generation.

### LocalStorage Serialization

**Risk Level: LOW-MEDIUM**

- Selections stored/retrieved from localStorage
- Chart instances excluded from serialization (runtime-only)
- Must handle missing/corrupted cache gracefully

**Why risky**: Data format changes could break cached selections. No migration strategy visible.

### Candlestick Pattern Point Configuration

**Risk Level: LOW**

Lines 204-228 in file:client/src/app/services/chart.service.ts:

- Special handling for candlestick pattern indicators
- Calculates point positions based on candle high/low
- Applies rotation and color based on match value (-100, 100, other)

**Why risky**: Edge case logic that's easy to miss during extraction.

## 3. Test Coverage

### Current Test Coverage

**ConfigService**: ✅ **Minimal but present**

- file:client/src/app/services/config.service.spec.ts (27 lines)
- Tests: 1 test verifying overlay config uses candlestick chart type
- Coverage: ~5% of ConfigService functionality

**ChartService**: ❌ **No tests found**

- No `chart.service.spec.ts` file exists
- ~1,000 lines of untested code

**Financial Plugin**: ✅ **Good coverage**

- file:client/src/chartjs/financial/register-financial.spec.ts - registration logic
- file:client/src/chartjs/financial/financial.integration.spec.ts - candlestick chart rendering
- file:client/src/chartjs/financial/factories/datasets.spec.ts - dataset builders
- file:client/src/chartjs/financial/theme/colors.spec.ts - color utilities

**Integration Tests**: ✅ **Financial plugin only**

- Integration test creates minimal candlestick chart
- Verifies Chart.js recognizes candlestick type

### Critical Gaps

**Untested Critical Paths**:

1. ❌ Chart initialization sequence (loadCharts → processQuotes → createOverlayChart)
2. ❌ Indicator data fetching and processing (addSelection → processSelectionData)
3. ❌ Window resize logic (dataset slicing, bar count calculation)
4. ❌ Theme switching (onSettingsChange)
5. ❌ Selection deletion (chart cleanup, DOM removal)
6. ❌ LocalStorage serialization/deserialization

**Untested ConfigService Methods**:

- `baseOscillatorConfig()`, `baseOscillatorOptions()`
- `baseDataset()` - 6 line types (solid, dash, dots, bar, pointer, none)
- `commonLegendAnnotation()`
- Y-axis formatting callbacks

### Test Reliability

**Financial Plugin Tests**: Reliable

- Use mocked canvas context
- Test in isolation
- Fast execution

**ConfigService Test**: Reliable but incomplete

- Uses MockUserService
- Tests single configuration method

## 4. Change Surface Area

### Files Requiring Extraction

**Core Chart Logic** (~2,440 lines total):

- file:client/src/app/services/chart.service.ts (~1,000 lines)
- file:client/src/app/services/config.service.ts (~400 lines)
- file:client/src/chartjs/financial/ (~1,040 lines across multiple files)

**Supporting Files**:

- file:client/src/app/pages/chart/chart.models.ts - type definitions
- file:client/src/chartjs/financial/factories/datasets.ts - data transformers
- file:client/src/chartjs/financial/factories/options.ts - option builders

### Files Requiring Updates (Angular App)

**Component Updates** (3 files):

- file:client/src/app/pages/chart/chart.component.ts - import from library
- file:client/src/app/components/picker/settings.component.ts - import from library
- file:client/src/app/components/picker/pick-config.component.ts - import from library

**Service Updates** (2 files):

- file:client/src/app/services/chart.service.ts - delegate to library abstractions
- file:client/src/app/services/config.service.ts - may be removed or become thin wrapper

**Bootstrap** (1 file):

- file:client/src/main.ts - import `registerFinancialCharts` from library path

### External Dependencies Affected

**Chart.js Ecosystem**:

- Chart.js v4.5.1 (peer dependency)
- chartjs-adapter-date-fns (time series)
- chartjs-plugin-annotation (legends)

**Angular-Specific**:

- RxJS (Observable patterns in ChartService)
- Angular HttpClient (API calls)
- Angular dependency injection

### Estimated Impact Scope

**High Impact** (must change):

- 3 Angular components (ChartComponent, SettingsComponent, PickConfigComponent)
- 2 Angular services (ChartService, ConfigService)
- 1 bootstrap file (main.ts)
- Build configuration (tsconfig paths, package.json)

**Medium Impact** (may need adjustment):

- Type definitions (chart.models.ts)
- Test files (update imports)
- API service integration

**Low Impact** (minimal changes):

- Financial plugin (already framework-agnostic)
- UserService, WindowService (remain in Angular app)

---

## Summary

**Blast Radius**: Moderate - affects 6 core files directly, 3 components indirectly

**Risk Profile**: Medium-High due to:

- Complex initialization sequence
- Untested ChartService (~1,000 lines)
- Dynamic resize logic with state management
- Global Chart.js state mutations

**Test Coverage**: Inadequate for safe refactoring

- Financial plugin: Good ✅
- ConfigService: Minimal ⚠️
- ChartService: None ❌

**Recommended Mitigation**:

1. Add characterization tests for ChartService critical paths before refactoring
2. Extract in phases: financial plugin → ConfigService → ChartService
3. Maintain parallel implementations during transition
4. Extensive manual testing of chart rendering, theme switching, and resize behavior
