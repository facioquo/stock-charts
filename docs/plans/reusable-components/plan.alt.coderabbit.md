## Coding Plan

> This is an alternate plan proposed by CodeRabbit AI bot in [Issue 452](https://github.com/facioquo/stock-charts/issues/452#issuecomment-3907187086)

### Summary

- Extract complete chart system including Chart.js plugin, all ConfigService methods, and data transformation logic into a unified library
- Create high-level `OverlayChart` and `OscillatorChart` abstractions as the primary library exports, handling all Chart.js configuration internally
- Build optional API integration layer supporting both dynamic fetching and static data for VitePress build-time rendering
- Replace Angular service injection with parameter-based configuration throughout for framework independence

<details>
<summary><b>Design Choices</b></summary>

<details>
<summary><b>Design Choice 1: Package Publishing Strategy</b></summary>

**Options Considered:**

1. Publish to npm as a public package for easy consumption anywhere
2. Use npm workspace/monorepo linking for local development only
3. Use git submodules to share code between repositories

**Chosen Option:** 1

**Rationale:** Publishing to npm provides the cleanest separation of concerns, independent versioning, and allows consumption in any JavaScript project without cross-repository dependencies.

</details>

<details>
<summary><b>Design Choice 2: Build Tooling Approach</b></summary>

**Options Considered:**

1. Use ng-packagr (Angular's library builder) to create an Angular-compatible package
2. Use standalone TypeScript compiler (tsc) with rollup/esbuild for a pure JS/TS library
3. Use Vite library mode for modern ES module output

**Chosen Option:** 2

**Rationale:** Using tsc with a lightweight bundler keeps the library framework-agnostic, avoiding Angular-specific build artifacts and ensuring the package works seamlessly in VitePress (Vue-based) and other environments.

</details>

<details>
<summary><b>Design Choice 3: API Integration Pattern</b></summary>

**Options Considered:**

1. Build HTTP client into the library with configurable base URL
2. Accept data as parameters only (consumer handles all fetching)
3. Provide both: built-in fetch utilities and accept pre-fetched data

**Chosen Option:** 3

**Rationale:** Providing both patterns maximizes flexibility - VitePress can use static pre-fetched data at build time while interactive applications can use the built-in fetch utilities for dynamic data loading.

</details>

</details>

<b>💡 User Tips</b>

Regenerate the plan with different choices with `@coderabbitai <feedback>`.

## Implementation Steps

### Phase 1: Extract Complete Chart Configuration System

Extract all framework-agnostic chart configuration logic from ConfigService and ChartService into the library, converting Angular dependency injection patterns to parameter-based configuration.

<details>
<summary><b>Task 1: Create Configuration Types and Interfaces</b></summary>

Define the parameter-based configuration interfaces that replace Angular service injection.

- Create `client/src/chartjs/financial/config/types.ts` with configuration interfaces
- Define `ChartSettings` interface to replace UserService injection (isDarkTheme, showTooltips)
- Define `OverlayChartConfig` interface for overlay chart initialization (quotes, volumeAxisSize, theme)
- Define `OscillatorChartConfig` interface for oscillator charts (indicator, thresholds, yAxisBounds)
- Define `DatasetConfig` interface to capture all lineType, color, and fill options from ConfigService

</details>

<details>
<summary><b>Task 2: Extract Chart Configuration Builders</b></summary>

Convert ConfigService methods to pure functions that accept settings as parameters.

- Create `client/src/chartjs/financial/config/overlay.ts` with overlay chart configuration builders
- Extract `baseOverlayConfig(volumeAxisSize, settings)` and `baseOverlayOptions(volumeAxisSize, settings)` as pure functions
- Create `client/src/chartjs/financial/config/oscillator.ts` with oscillator chart configuration builders
- Extract `baseOscillatorConfig(settings)` and `baseOscillatorOptions(settings)` as pure functions
- Extract shared `baseChartOptions(settings)` and `defaultXAxisOptions()` into `client/src/chartjs/financial/config/common.ts`

</details>

<details>
<summary><b>Task 3: Extract Dataset and Annotation Builders</b></summary>

Extract dataset creation and annotation logic as pure factory functions.

- Create `client/src/chartjs/financial/config/datasets.ts` for indicator dataset builders
- Extract `baseDataset(result, resultConfig, settings)` supporting all 6 line types (solid, dash, dots, bar, pointer, none)
- Create `client/src/chartjs/financial/config/annotations.ts` for legend annotations
- Extract `commonLegendAnnotation(label, xPos, yPos, yAdj, settings)` as a pure function
- Extract threshold dataset creation logic from ChartService.createThresholdDataset()

</details>

<details>
<summary><b>Task 4: Extract Data Transformation Pipeline</b></summary>

Extract the data processing logic that transforms API responses into Chart.js datasets.

- Create `client/src/chartjs/financial/data/transformers.ts` for data transformation utilities
- Extract quote processing logic from ChartService.processQuoteData() (calculates volumeAxisSize, creates FinancialDataPoints)
- Extract indicator data processing from ChartService.buildDataPoints() (converts API response to ScatterDataPoints)
- Extract extra bars padding logic from ChartService.addExtraBars()
- Extract candlestick pattern point configuration logic from ChartService.getCandlePointConfiguration()

</details>

<details>
<summary><b>🤖 Prompt for AI agents</b></summary>

```markdown
This phase extracts all framework-agnostic chart configuration logic from
ConfigService and ChartService into the library. The goal is to convert Angular
dependency injection patterns to parameter-based pure functions.

**Create Configuration Types and Interfaces:**

- Create `client/src/chartjs/financial/config/types.ts`:
- Define `ChartSettings` interface with properties: `isDarkTheme: boolean`, `showTooltips: boolean` (replaces UserService injection)
- Define `OverlayChartConfig` interface with properties: quotes array, volumeAxisSize, theme object, optional indicators array
- Define `OscillatorChartConfig` interface with properties: indicator data, thresholds array, yAxisBounds configuration
- Define `DatasetConfig` interface capturing all lineType options (solid, dash, dots, bar, pointer, none), color properties, and fill options from ConfigService
  - Export all configuration types for external consumption

**Extract Chart Configuration Builders:**

- Create `client/src/chartjs/financial/config/overlay.ts`:
- Extract `baseOverlayConfig(volumeAxisSize, settings)` as pure function returning Chart.js config object for overlay charts
- Extract `baseOverlayOptions(volumeAxisSize, settings)` as pure function returning Chart.js options for overlay charts
- Create `client/src/chartjs/financial/config/oscillator.ts`:
- Extract `baseOscillatorConfig(settings)` as pure function returning Chart.js config object for oscillator charts
- Extract `baseOscillatorOptions(settings)` as pure function returning Chart.js options for oscillator charts
- Create `client/src/chartjs/financial/config/common.ts`:
  - Extract shared `baseChartOptions(settings)` for common chart options
  - Extract `defaultXAxisOptions()` for standard x-axis configuration
- All functions should be pure, accepting settings as parameters instead of injecting UserService

**Extract Dataset and Annotation Builders:**

- Create `client/src/chartjs/financial/config/datasets.ts`:
- Extract `baseDataset(result, resultConfig, settings)` as pure function supporting all 6 line types: solid, dash, dots, bar, pointer, none
- Function should return Chart.js dataset configuration object with appropriate styling
- Create `client/src/chartjs/financial/config/annotations.ts`:
- Extract `commonLegendAnnotation(label, xPos, yPos, yAdj, settings)` as pure function for creating legend annotations
- Extract threshold dataset creation logic from ChartService.createThresholdDataset() as pure function
  - All annotation functions should accept settings as parameters

**Extract Data Transformation Pipeline:**

- Create `client/src/chartjs/financial/data/transformers.ts`:
- Extract quote processing logic from ChartService.processQuoteData(): calculates volumeAxisSize, creates FinancialDataPoints from raw OHLCV data
- Extract indicator data processing from ChartService.buildDataPoints(): converts API response format to ScatterDataPoints for Chart.js
- Extract extra bars padding logic from ChartService.addExtraBars(): adds padding bars to chart edges
- Extract candlestick pattern point configuration from ChartService.getCandlePointConfiguration(): configures pattern visualization
  - All transformers should be pure functions accepting data as parameters
```

</details>

### Phase 2: Build High-Level Chart Abstractions

Create the main library exports: OverlayChart and OscillatorChart classes that provide simple APIs and handle all chart lifecycle management internally.

<details>
<summary><b>Task 1: Create OverlayChart Abstraction</b></summary>

Build the primary overlay chart component that manages candlestick, volume, and overlay indicator datasets.

- Create `client/src/chartjs/financial/charts/overlay-chart.ts` as the main overlay chart class
- Implement constructor accepting canvas element and `OverlayChartConfig` (quotes, theme, optional indicators)
- Implement `render()` method that creates candlestick + volume datasets and instantiates Chart.js
- Implement `addIndicator(indicatorData, resultConfig)` to add overlay indicators to existing chart
- Implement `removeIndicator(indicatorId)` to remove indicators from the chart
- Implement `updateTheme(theme)` to switch between dark/light modes
- Implement `resize()` and `destroy()` lifecycle methods

</details>

<details>
<summary><b>Task 2: Create OscillatorChart Abstraction</b></summary>

Build the oscillator chart component for indicators displayed in separate chart panels.

- Create `client/src/chartjs/financial/charts/oscillator-chart.ts` as the oscillator chart class
- Implement constructor accepting canvas element and `OscillatorChartConfig` (indicator data, thresholds, yAxisBounds)
- Implement `render()` method that creates indicator datasets with threshold lines and instantiates Chart.js
- Implement threshold line creation with fill regions between threshold values
- Implement legend annotation placement using chart scale coordinates
- Implement `updateTheme(theme)`, `resize()`, and `destroy()` lifecycle methods
- Handle y-axis value formatting with intelligent K/M/B suffixes

</details>

<details>
<summary><b>Task 3: Create Chart Manager for Multi-Chart Coordination</b></summary>

Build a coordinator class that manages an overlay chart and multiple oscillator charts together.

- Create `client/src/chartjs/financial/charts/chart-manager.ts` for coordinating multiple charts
- Implement `createOverlayChart(canvasId, quotes, theme)` to initialize the main price chart
- Implement `addOscillator(containerId, indicatorConfig)` to create and track oscillator charts
- Implement `removeOscillator(indicatorId)` to destroy and remove oscillator charts
- Implement `updateAllThemes(theme)` to synchronize theme across all charts
- Implement `resizeAll()` for coordinated resize handling
- Store references to all chart instances for lifecycle management

</details>

<details>
<summary><b>🤖 Prompt for AI agents</b></summary>

```markdown
This phase creates the main library exports: OverlayChart and OscillatorChart
classes with simple high-level APIs. The goal is to provide complete chart
lifecycle management internally.

**Create OverlayChart Abstraction:**

- Create `client/src/chartjs/financial/charts/overlay-chart.ts`:
  - Define `OverlayChart` class as primary overlay chart component
- Constructor should accept: canvas element (HTMLCanvasElement or canvas ID string) and `OverlayChartConfig` (quotes array, theme object, optional indicators array)
  - Implement `render()` method:
    - Use data transformers to process quotes into FinancialDataPoints
    - Create candlestick dataset using financial plugin
    - Create volume bar dataset
    - Use overlay configuration builders from Phase 1
    - Instantiate Chart.js with generated config
- Implement `addIndicator(indicatorData, resultConfig)`: add overlay indicator datasets to existing chart, update chart
- Implement `removeIndicator(indicatorId)`: remove indicator datasets from chart by ID
- Implement `updateTheme(theme)`: switch between dark/light modes, update chart colors and background
  - Implement `resize()` and `destroy()` lifecycle methods for chart cleanup
  - Store Chart.js instance reference internally

**Create OscillatorChart Abstraction:**

- Create `client/src/chartjs/financial/charts/oscillator-chart.ts`:
  - Define `OscillatorChart` class for oscillator chart panels
- Constructor should accept: canvas element and `OscillatorChartConfig` (indicator data, thresholds array, yAxisBounds configuration)
  - Implement `render()` method:
    - Use data transformers to process indicator data into ScatterDataPoints
    - Create indicator line datasets using dataset builders from Phase 1
- Create threshold lines with fill regions between threshold values using annotation builders - Use oscillator configuration builders from Phase 1 - Instantiate Chart.js with generated config
  - Implement legend annotation placement using chart scale coordinates
  - Implement `updateTheme(theme)`: switch theme, update colors
  - Implement `resize()` and `destroy()` lifecycle methods
- Handle y-axis value formatting with intelligent K/M/B suffixes (thousands, millions, billions)
  - Store Chart.js instance reference internally

**Create Chart Manager for Multi-Chart Coordination:**

- Create `client/src/chartjs/financial/charts/chart-manager.ts`:
  - Define `ChartManager` class for coordinating multiple charts
- Implement `createOverlayChart(canvasId, quotes, theme)`: instantiate and store OverlayChart, return chart instance
- Implement `addOscillator(containerId, indicatorConfig)`: create OscillatorChart instance, track in internal map/array, return chart instance
- Implement `removeOscillator(indicatorId)`: destroy and remove OscillatorChart by ID from tracking
- Implement `updateAllThemes(theme)`: iterate through all chart instances (overlay + oscillators), call updateTheme on each
- Implement `resizeAll()`: iterate through all chart instances, call resize() on each
- Store references to overlay chart and oscillator charts map for lifecycle management
  - Implement `destroy()` method to clean up all chart instances
```

</details>

### Phase 3: Build API Integration Layer

Create data fetching utilities and data models that can be used optionally by consumers who want built-in API support.

<details>
<summary><b>Task 1: Create Data Models and Type Definitions</b></summary>

Define the data contracts matching the backend API responses.

- Create `client/src/chartjs/financial/api/models.ts` with API data types
- Define `Quote` and `RawQuote` interfaces for OHLCV data
- Define `IndicatorListing` interface for indicator metadata catalog
- Define `IndicatorDataRow` interface for indicator API responses
- Define `IndicatorParam` and `IndicatorResult` interfaces for indicator configuration
- Define `ChartConfig`, `ChartThreshold`, and `ChartFill` interfaces for chart styling

</details>

<details>
<summary><b>Task 2: Create API Client Utilities</b></summary>

Build framework-agnostic fetch utilities for retrieving chart data.

- Create `client/src/chartjs/financial/api/client.ts` with fetch-based API utilities
- Implement `createApiClient(baseUrl)` factory that returns a configured client instance
- Implement `fetchQuotes()` method returning Promise<Quote[]> with date transformation
- Implement `fetchIndicatorListings()` method returning Promise<IndicatorListing[]>
- Implement `fetchIndicatorData(endpoint, params)` method for dynamic indicator fetching
- Support configurable error handling callback for graceful degradation

</details>

<details>
<summary><b>Task 3: Create Static Data Support</b></summary>

Enable usage with pre-bundled static data for build-time rendering scenarios like VitePress.

- Create `client/src/chartjs/financial/api/static.ts` for static data utilities
- Implement `loadStaticQuotes(data)` that accepts and transforms raw quote arrays
- Implement `loadStaticIndicatorData(data)` for pre-computed indicator results
- Ensure static data loading follows same transformation pipeline as API data
- Document how to bundle backup JSON data with VitePress builds

</details>

<details>
<summary><b>🤖 Prompt for AI agents</b></summary>

```markdown
This phase creates the API integration layer with data models and optional fetch
utilities. The goal is to support both dynamic fetching and static data for
VitePress build-time rendering.

**Create Data Models and Type Definitions:**

- Create `client/src/chartjs/financial/api/models.ts`:
- Define `Quote` interface: date (Date), open (number), high (number), low (number), close (number), volume (number)
- Define `RawQuote` interface: same as Quote but date as string for JSON serialization
- Define `IndicatorListing` interface: id, name, endpoint, description, category, parameters array, results array for indicator metadata catalog
- Define `IndicatorDataRow` interface: date, indicator result values as key-value pairs
- Define `IndicatorParam` interface: name, type, defaultValue, description for indicator parameters
- Define `IndicatorResult` interface: name, lineType, color for indicator results configuration
  - Define `ChartConfig` interface: chart display configuration
  - Define `ChartThreshold` interface: value, label for threshold lines
  - Define `ChartFill` interface: fill region configuration
  - Export all types for consumption

**Create API Client Utilities:**

- Create `client/src/chartjs/financial/api/client.ts`:
  - Implement `createApiClient(baseUrl)` factory function:
    - Returns configured client object with methods
    - Store baseUrl internally
  - Implement `fetchQuotes()` method:
    - Use fetch API to retrieve quotes from endpoint
    - Return Promise<Quote[]>
    - Transform date strings to Date objects
    - Handle errors gracefully
  - Implement `fetchIndicatorListings()` method:
    - Fetch indicator catalog/metadata
    - Return Promise<IndicatorListing[]>
  - Implement `fetchIndicatorData(endpoint, params)` method:
    - Accept dynamic endpoint and query parameters
    - Fetch indicator calculation results
    - Return Promise with indicator data
  - Support configurable error handling callback for graceful degradation
  - Use modern fetch API, keep framework-agnostic

**Create Static Data Support:**

- Create `client/src/chartjs/financial/api/static.ts`:
  - Implement `loadStaticQuotes(data)` function:
    - Accept raw quote array (with string dates)
    - Transform to Quote[] (convert date strings to Date objects)
    - Use same transformation pipeline as API data
    - Return Quote[]
  - Implement `loadStaticIndicatorData(data)` function:
    - Accept pre-computed indicator results
    - Transform to standard indicator data format
    - Use same transformation pipeline as API data
    - Return standardized indicator data
  - Document in JSDoc comments how to bundle JSON data with VitePress builds
- Ensure static data loading is synchronous or returns resolved promises for
  build-time usage
```

</details>

### Phase 4: Configure Library Build and Application Integration

Set up the build pipeline for library distribution and update the Angular application to consume the library.

<details>
<summary><b>Task 1: Update Library Package Configuration</b></summary>

Configure the package.json for npm publishing with appropriate metadata and dependencies.

- Update `client/src/chartjs/financial/package.json` to remove `"private": true` and add publishing metadata
- Define `chart.js` as a peer dependency (users must install Chart.js separately)
- Add `chartjs-adapter-date-fns` and `date-fns` as optional peer dependencies for time-series support
- Set appropriate `main`, `module`, and `types` entry points for CommonJS, ESM, and TypeScript consumers
- Add `exports` field for modern package resolution
- Include `files` array to specify which files to publish

</details>

<details>
<summary><b>Task 2: Create Library TypeScript Configuration</b></summary>

Set up TypeScript compilation specifically for the library output.

- Create `client/src/chartjs/financial/tsconfig.lib.json` with library-appropriate compiler options
- Configure declaration file generation (`declaration: true`, `declarationMap: true`)
- Set module output format to ES2020 for modern consumers
- Configure `outDir` to output to a `dist/` folder within the library directory
- Exclude test files and Angular-specific code from library compilation

</details>

<details>
<summary><b>Task 3: Add Library Build Scripts and Entry Points</b></summary>

Configure npm scripts and ensure proper module format support.

- Add `build:lib` script to `client/package.json` to compile the financial chart library
- Configure the script to run TypeScript compiler with the library tsconfig
- Update `client/src/chartjs/financial/index.ts` to export all new high-level APIs (OverlayChart, OscillatorChart, ChartManager)
- Export configuration types, API client, and static data utilities
- Add `prepublishOnly` script to ensure library is built before publishing

</details>

<details>
<summary><b>Task 4: Configure Angular Application Path Mapping</b></summary>

Set up path aliases and update imports in the Angular application.

- Update `client/tsconfig.json` to add a path mapping for the library (e.g., `@stock-charts/financial`)
- Update `client/src/main.ts` to import `registerFinancialCharts` from the library path alias
- Update `client/src/app/services/chart.service.ts` to import from library and delegate to extracted utilities
- Update `client/src/app/services/config.service.ts` to use extracted configuration builders from library
- Search for and update any other files importing from relative `chartjs/financial` paths

</details>

<details>
<summary><b>Task 5: Validate Existing Functionality</b></summary>

Confirm the Angular application works correctly with the refactored architecture.

- Run the existing test suite to verify no regressions
- Manually test chart rendering, theme switching, and indicator functionality
- Verify the development server (`ng serve`) works with the path mappings
- Ensure production builds (`ng build --configuration=production`) complete successfully

</details>

<details>
<summary><b>🤖 Prompt for AI agents</b></summary>

```markdown
This phase sets up the library build pipeline and integrates the library into
the Angular application using path mappings. The goal is to enable distribution
and validate the refactored architecture.

**Update Library Package Configuration:**

- Modify `client/src/chartjs/financial/package.json`:
  - Remove `"private": true` field
- Add publishing metadata: `name`, `version`, `description`, `keywords`, `repository`, `license`, `author`
  - Define `chart.js` as a peer dependency with version range
  - Add `chartjs-adapter-date-fns` and `date-fns` as optional peer dependencies
- Set entry points: `main`, `module`, and `types` fields for CommonJS, ESM, and TypeScript
  - Add `exports` field for modern package resolution with conditional exports
  - Include `files` array listing which files should be published to npm

**Create Library TypeScript Configuration:**

- Create `client/src/chartjs/financial/tsconfig.lib.json`:
- Set compiler options appropriate for library output (strict mode, module resolution)
- Enable declaration file generation: `declaration: true`, `declarationMap:
true`
  - Set module output format to ES2020 or ESNext for modern consumers
  - Configure `outDir` to `./dist` within the library directory
  - Set `rootDir` to the library source location
  - Exclude test files, spec files, and any Angular-specific code
  - Configure appropriate `target` and `lib` settings for broad compatibility

**Add Library Build Scripts and Entry Points:**

- Add scripts to `client/package.json`:
- `build:lib`: Run TypeScript compiler with `tsconfig.lib.json` to compile the library
  - `prepublishOnly`: Hook to automatically build before npm publish
- Update `client/src/chartjs/financial/index.ts`:
- Export all new high-level APIs: `OverlayChart`, `OscillatorChart`, `ChartManager` classes
- Export configuration types from Phase 1: `ChartSettings`, `OverlayChartConfig`, `OscillatorChartConfig`, `DatasetConfig`
  - Export API client utilities: `createApiClient`, API models
  - Export static data utilities: `loadStaticQuotes`, `loadStaticIndicatorData`
- Export existing financial plugin components (controllers, elements, registration functions)
  - Ensure all public APIs are exported for external consumption

**Configure Angular Application Path Mapping:**

- Update `client/tsconfig.json`:
- Add path mapping in `compilerOptions.paths` for the library (e.g., `"@stock-charts/financial": ["./src/chartjs/financial/index.ts"]`)
  - Ensure the path resolves to the library's source during development
- Update Angular application files:
- `client/src/main.ts`: Import `registerFinancialCharts` from `@stock-charts/financial`
- `client/src/app/services/chart.service.ts`: Import chart abstractions and utilities from library, refactor to delegate to `OverlayChart`, `OscillatorChart`, and data transformers
- `client/src/app/services/config.service.ts`: Import and use extracted configuration builders from library instead of local methods
- Search for any files with relative imports like `../../chartjs/financial` and replace with `@stock-charts/financial` path alias

**Validate Existing Functionality:**

- Run existing test suite to verify no regressions from the refactoring
- Manually test critical functionality:
  - Chart rendering (candlestick, OHLC, volume bars)
  - Theme switching (dark/light mode)
  - Indicator functionality and data updates
  - Adding/removing indicators dynamically
- Verify development server (`ng serve`) starts and works correctly with path mappings
- Verify production build (`ng build --configuration=production`) completes successfully
- Test the built production application to ensure runtime behavior is unchanged
```

</details>

### Phase 5: Documentation and Publishing Preparation

Create documentation focused on the simple, high-level API for library consumers.

<details>
<summary><b>Task 1: Create Library Usage Documentation</b></summary>

Document the simple high-level API for creating charts.

- Update `client/src/chartjs/financial/README.md` with installation instructions and peer dependencies
- Document the primary API: `OverlayChart`, `OscillatorChart`, and `ChartManager` classes
- Add quick-start example showing chart creation in 5-10 lines of code
- Document theme configuration and how to respond to dark/light mode changes
- Include API reference for configuration interfaces and optional parameters

</details>

<details>
<summary><b>Task 2: Create VitePress Integration Guide</b></summary>

Document the specific integration pattern for VitePress/Vue projects.

- Create example showing how to wrap chart classes in a Vue component
- Document SSR handling (charts must render client-side only in VitePress)
- Show how to use static data loading for build-time chart rendering
- Demonstrate theme synchronization with VitePress dark mode toggle
- Include complete working example component for copy-paste usage

</details>

<details>
<summary><b>Task 3: Prepare for npm Publishing</b></summary>

Finalize the package for publication to npm.

- Verify package.json has correct `name`, `version`, `description`, `keywords`, `repository`, and `license` fields
- Ensure `.npmignore` or `files` field excludes test files, source maps, and development artifacts
- Run `npm pack` to verify the package contents before publishing
- Document the publishing process for future releases (manual or CI-based)

</details>

<details>
<summary><b>🤖 Prompt for AI agents</b></summary>

```markdown
This phase creates comprehensive documentation focused on the simple, high-level
API for library consumers. The goal is to enable easy adoption in external
projects, particularly VitePress.

**Create Library Usage Documentation:**

- Update or create `client/src/chartjs/financial/README.md`:
  - Add clear installation instructions (npm/yarn/pnpm commands)
- Document peer dependencies (Chart.js version compatibility, optional date adapters)
- Document the primary API: `OverlayChart`, `OscillatorChart`, and `ChartManager` classes with their methods
  - Add quick-start example showing chart creation in 5-10 lines of code:
    - Import the library
    - Create chart instance with minimal configuration
    - Render chart
- Document theme configuration options and how to respond to dark/light mode changes (updateTheme method)
- Include API reference for configuration interfaces: `ChartSettings`, `OverlayChartConfig`, `OscillatorChartConfig`
  - Document optional parameters and advanced configuration
- Add examples for common use cases (adding indicators, managing multiple charts)

**Create VitePress Integration Guide:**

- Create detailed VitePress integration guide (in README or separate doc):
- Show example Vue component wrapping `OverlayChart` or `OscillatorChart` classes
  - Document SSR handling:
    - Charts must render client-side only in VitePress
    - Show how to use `ClientOnly` component or `onMounted` lifecycle hook
  - Demonstrate static data loading for build-time chart rendering:
    - Import pre-bundled JSON data
    - Use `loadStaticQuotes` and `loadStaticIndicatorData` utilities
  - Show theme synchronization with VitePress dark mode toggle:
    - Use VitePress `useData` composable to detect theme
    - Call chart's `updateTheme` method on theme change
  - Include complete working example Vue component for copy-paste usage
  - Document any VitePress-specific configuration needed

**Prepare for npm Publishing:**

- Verify `client/src/chartjs/financial/package.json` has all required metadata:
  - `name`, `version`, `description` fields are correct
- `keywords` for discoverability (chart.js, financial, candlestick, stock charts, technical analysis)
  - `repository`, `bugs`, `homepage` URLs
  - `license` field (e.g., MIT)
  - `author` information
- Create or update `.npmignore` or use `files` field to exclude:
  - Test files and specs
  - Source maps (unless desired)
  - Development artifacts and config files (tsconfig, etc.)
- Run `npm pack` and inspect contents to verify only necessary files are included
- Document the publishing process:
  - Manual: `npm publish` steps with authentication
  - CI-based: Outline automated release workflow (optional)
  - Version bumping strategy (semantic versioning)
  - Changelog maintenance recommendations
```

</details>

<details>
<summary><b>Research</b></summary>

This is a financial stock charting application with an Angular 21 frontend and .NET backend. The Angular client contains three key layers of chart functionality: (1) A framework-agnostic Chart.js financial plugin at `client/src/chartjs/financial/` (~1,040 lines) implementing candlestick/OHLC chart types with custom controllers, elements, and theming; (2) ConfigService (~400 lines) containing chart configuration builders for overlay and oscillator charts, dataset factories, and annotation helpers that are 95% framework-agnostic; (3) ChartService (~1,000 lines) which orchestrates the complete chart lifecycle including data fetching, chart initialization, indicator management, and responsive resize handling. The goal is to extract all three layers into a unified library with simple high-level APIs that handle everything internally, so consumers can create complete stock charts with minimal code.

</details>

---

### 🚀 Next Steps

<details>
<summary><b>🤖 All AI agent prompts combined</b></summary>

```markdown
Task: 1

This phase extracts all framework-agnostic chart configuration logic from
ConfigService and ChartService into the library. The goal is to convert Angular
dependency injection patterns to parameter-based pure functions.

**Create Configuration Types and Interfaces:**

- Create `client/src/chartjs/financial/config/types.ts`:
- Define `ChartSettings` interface with properties: `isDarkTheme: boolean`, `showTooltips: boolean` (replaces UserService injection)
- Define `OverlayChartConfig` interface with properties: quotes array, volumeAxisSize, theme object, optional indicators array
- Define `OscillatorChartConfig` interface with properties: indicator data, thresholds array, yAxisBounds configuration
- Define `DatasetConfig` interface capturing all lineType options (solid, dash, dots, bar, pointer, none), color properties, and fill options from ConfigService
  - Export all configuration types for external consumption

**Extract Chart Configuration Builders:**

- Create `client/src/chartjs/financial/config/overlay.ts`:
- Extract `baseOverlayConfig(volumeAxisSize, settings)` as pure function returning Chart.js config object for overlay charts
- Extract `baseOverlayOptions(volumeAxisSize, settings)` as pure function returning Chart.js options for overlay charts
- Create `client/src/chartjs/financial/config/oscillator.ts`:
- Extract `baseOscillatorConfig(settings)` as pure function returning Chart.js config object for oscillator charts
- Extract `baseOscillatorOptions(settings)` as pure function returning Chart.js options for oscillator charts
- Create `client/src/chartjs/financial/config/common.ts`:
  - Extract shared `baseChartOptions(settings)` for common chart options
  - Extract `defaultXAxisOptions()` for standard x-axis configuration
- All functions should be pure, accepting settings as parameters instead of injecting UserService

**Extract Dataset and Annotation Builders:**

- Create `client/src/chartjs/financial/config/datasets.ts`:
- Extract `baseDataset(result, resultConfig, settings)` as pure function supporting all 6 line types: solid, dash, dots, bar, pointer, none
- Function should return Chart.js dataset configuration object with appropriate styling
- Create `client/src/chartjs/financial/config/annotations.ts`:
- Extract `commonLegendAnnotation(label, xPos, yPos, yAdj, settings)` as pure function for creating legend annotations
- Extract threshold dataset creation logic from ChartService.createThresholdDataset() as pure function
  - All annotation functions should accept settings as parameters

**Extract Data Transformation Pipeline:**

- Create `client/src/chartjs/financial/data/transformers.ts`:
- Extract quote processing logic from ChartService.processQuoteData(): calculates volumeAxisSize, creates FinancialDataPoints from raw OHLCV data
- Extract indicator data processing from ChartService.buildDataPoints(): converts API response format to ScatterDataPoints for Chart.js
- Extract extra bars padding logic from ChartService.addExtraBars(): adds padding bars to chart edges
- Extract candlestick pattern point configuration from ChartService.getCandlePointConfiguration(): configures pattern visualization
  - All transformers should be pure functions accepting data as parameters

---

Task: 2

This phase creates the main library exports: OverlayChart and OscillatorChart
classes with simple high-level APIs. The goal is to provide complete chart
lifecycle management internally.

**Create OverlayChart Abstraction:**

- Create `client/src/chartjs/financial/charts/overlay-chart.ts`:
  - Define `OverlayChart` class as primary overlay chart component
- Constructor should accept: canvas element (HTMLCanvasElement or canvas ID string) and `OverlayChartConfig` (quotes array, theme object, optional indicators array)
  - Implement `render()` method:
    - Use data transformers to process quotes into FinancialDataPoints
    - Create candlestick dataset using financial plugin
    - Create volume bar dataset
    - Use overlay configuration builders from Phase 1
    - Instantiate Chart.js with generated config
- Implement `addIndicator(indicatorData, resultConfig)`: add overlay indicator datasets to existing chart, update chart
- Implement `removeIndicator(indicatorId)`: remove indicator datasets from chart by ID
- Implement `updateTheme(theme)`: switch between dark/light modes, update chart colors and background
  - Implement `resize()` and `destroy()` lifecycle methods for chart cleanup
  - Store Chart.js instance reference internally

**Create OscillatorChart Abstraction:**

- Create `client/src/chartjs/financial/charts/oscillator-chart.ts`:
  - Define `OscillatorChart` class for oscillator chart panels
- Constructor should accept: canvas element and `OscillatorChartConfig` (indicator data, thresholds array, yAxisBounds configuration)
  - Implement `render()` method:
    - Use data transformers to process indicator data into ScatterDataPoints
    - Create indicator line datasets using dataset builders from Phase 1
- Create threshold lines with fill regions between threshold values using annotation builders - Use oscillator configuration builders from Phase 1 - Instantiate Chart.js with generated config
  - Implement legend annotation placement using chart scale coordinates
  - Implement `updateTheme(theme)`: switch theme, update colors
  - Implement `resize()` and `destroy()` lifecycle methods
- Handle y-axis value formatting with intelligent K/M/B suffixes (thousands, millions, billions)
  - Store Chart.js instance reference internally

**Create Chart Manager for Multi-Chart Coordination:**

- Create `client/src/chartjs/financial/charts/chart-manager.ts`:
  - Define `ChartManager` class for coordinating multiple charts
- Implement `createOverlayChart(canvasId, quotes, theme)`: instantiate and store OverlayChart, return chart instance
- Implement `addOscillator(containerId, indicatorConfig)`: create OscillatorChart instance, track in internal map/array, return chart instance
- Implement `removeOscillator(indicatorId)`: destroy and remove OscillatorChart by ID from tracking
- Implement `updateAllThemes(theme)`: iterate through all chart instances (overlay + oscillators), call updateTheme on each
- Implement `resizeAll()`: iterate through all chart instances, call resize() on each
- Store references to overlay chart and oscillator charts map for lifecycle management
  - Implement `destroy()` method to clean up all chart instances

---

Task: 3

This phase creates the API integration layer with data models and optional fetch
utilities. The goal is to support both dynamic fetching and static data for
VitePress build-time rendering.

**Create Data Models and Type Definitions:**

- Create `client/src/chartjs/financial/api/models.ts`:
- Define `Quote` interface: date (Date), open (number), high (number), low (number), close (number), volume (number)
- Define `RawQuote` interface: same as Quote but date as string for JSON serialization
- Define `IndicatorListing` interface: id, name, endpoint, description, category, parameters array, results array for indicator metadata catalog
- Define `IndicatorDataRow` interface: date, indicator result values as key-value pairs
- Define `IndicatorParam` interface: name, type, defaultValue, description for indicator parameters
- Define `IndicatorResult` interface: name, lineType, color for indicator results configuration
  - Define `ChartConfig` interface: chart display configuration
  - Define `ChartThreshold` interface: value, label for threshold lines
  - Define `ChartFill` interface: fill region configuration
  - Export all types for consumption

**Create API Client Utilities:**

- Create `client/src/chartjs/financial/api/client.ts`:
  - Implement `createApiClient(baseUrl)` factory function:
    - Returns configured client object with methods
    - Store baseUrl internally
  - Implement `fetchQuotes()` method:
    - Use fetch API to retrieve quotes from endpoint
    - Return Promise<Quote[]>
    - Transform date strings to Date objects
    - Handle errors gracefully
  - Implement `fetchIndicatorListings()` method:
    - Fetch indicator catalog/metadata
    - Return Promise<IndicatorListing[]>
  - Implement `fetchIndicatorData(endpoint, params)` method:
    - Accept dynamic endpoint and query parameters
    - Fetch indicator calculation results
    - Return Promise with indicator data
  - Support configurable error handling callback for graceful degradation
  - Use modern fetch API, keep framework-agnostic

**Create Static Data Support:**

- Create `client/src/chartjs/financial/api/static.ts`:
  - Implement `loadStaticQuotes(data)` function:
    - Accept raw quote array (with string dates)
    - Transform to Quote[] (convert date strings to Date objects)
    - Use same transformation pipeline as API data
    - Return Quote[]
  - Implement `loadStaticIndicatorData(data)` function:
    - Accept pre-computed indicator results
    - Transform to standard indicator data format
    - Use same transformation pipeline as API data
    - Return standardized indicator data
  - Document in JSDoc comments how to bundle JSON data with VitePress builds
- Ensure static data loading is synchronous or returns resolved promises for build-time usage

---

Task: 4

This phase sets up the library build pipeline and integrates the library into
the Angular application using path mappings. The goal is to enable distribution
and validate the refactored architecture.

**Update Library Package Configuration:**

- Modify `client/src/chartjs/financial/package.json`:
  - Remove `"private": true` field
- Add publishing metadata: `name`, `version`, `description`, `keywords`, `repository`, `license`, `author`
  - Define `chart.js` as a peer dependency with version range
  - Add `chartjs-adapter-date-fns` and `date-fns` as optional peer dependencies
- Set entry points: `main`, `module`, and `types` fields for CommonJS, ESM, and TypeScript
  - Add `exports` field for modern package resolution with conditional exports
  - Include `files` array listing which files should be published to npm

**Create Library TypeScript Configuration:**

- Create `client/src/chartjs/financial/tsconfig.lib.json`:
- Set compiler options appropriate for library output (strict mode, module resolution)
- Enable declaration file generation: `declaration: true`, `declarationMap:
true`
  - Set module output format to ES2020 or ESNext for modern consumers
  - Configure `outDir` to `./dist` within the library directory
  - Set `rootDir` to the library source location
  - Exclude test files, spec files, and any Angular-specific code
  - Configure appropriate `target` and `lib` settings for broad compatibility

**Add Library Build Scripts and Entry Points:**

- Add scripts to `client/package.json`:
- `build:lib`: Run TypeScript compiler with `tsconfig.lib.json` to compile the library
  - `prepublishOnly`: Hook to automatically build before npm publish
- Update `client/src/chartjs/financial/index.ts`:
- Export all new high-level APIs: `OverlayChart`, `OscillatorChart`, `ChartManager` classes
- Export configuration types from Phase 1: `ChartSettings`, `OverlayChartConfig`, `OscillatorChartConfig`, `DatasetConfig`
  - Export API client utilities: `createApiClient`, API models
  - Export static data utilities: `loadStaticQuotes`, `loadStaticIndicatorData`
- Export existing financial plugin components (controllers, elements, registration functions)
  - Ensure all public APIs are exported for external consumption

**Configure Angular Application Path Mapping:**

- Update `client/tsconfig.json`:
- Add path mapping in `compilerOptions.paths` for the library (e.g., `"@stock-charts/financial": ["./src/chartjs/financial/index.ts"]`)
  - Ensure the path resolves to the library's source during development
- Update Angular application files:
- `client/src/main.ts`: Import `registerFinancialCharts` from `@stock-charts/financial`
- `client/src/app/services/chart.service.ts`: Import chart abstractions and utilities from library, refactor to delegate to `OverlayChart`, `OscillatorChart`, and data transformers
- `client/src/app/services/config.service.ts`: Import and use extracted configuration builders from library instead of local methods
- Search for any files with relative imports like `../../chartjs/financial` and replace with `@stock-charts/financial` path alias

**Validate Existing Functionality:**

- Run existing test suite to verify no regressions from the refactoring
- Manually test critical functionality:
  - Chart rendering (candlestick, OHLC, volume bars)
  - Theme switching (dark/light mode)
  - Indicator functionality and data updates
  - Adding/removing indicators dynamically
- Verify development server (`ng serve`) starts and works correctly with path mappings
- Verify production build (`ng build --configuration=production`) completes successfully
- Test the built production application to ensure runtime behavior is unchanged

---

Task: 5

This phase creates comprehensive documentation focused on the simple, high-level
API for library consumers. The goal is to enable easy adoption in external
projects, particularly VitePress.

**Create Library Usage Documentation:**

- Update or create `client/src/chartjs/financial/README.md`:
  - Add clear installation instructions (npm/yarn/pnpm commands)
- Document peer dependencies (Chart.js version compatibility, optional date adapters)
- Document the primary API: `OverlayChart`, `OscillatorChart`, and `ChartManager` classes with their methods
  - Add quick-start example showing chart creation in 5-10 lines of code:
    - Import the library
    - Create chart instance with minimal configuration
    - Render chart
- Document theme configuration options and how to respond to dark/light mode changes (updateTheme method)
- Include API reference for configuration interfaces: `ChartSettings`, `OverlayChartConfig`, `OscillatorChartConfig`
  - Document optional parameters and advanced configuration
- Add examples for common use cases (adding indicators, managing multiple charts)

**Create VitePress Integration Guide:**

- Create detailed VitePress integration guide (in README or separate doc):
- Show example Vue component wrapping `OverlayChart` or `OscillatorChart` classes
  - Document SSR handling:
    - Charts must render client-side only in VitePress
    - Show how to use `ClientOnly` component or `onMounted` lifecycle hook
  - Demonstrate static data loading for build-time chart rendering:
    - Import pre-bundled JSON data
    - Use `loadStaticQuotes` and `loadStaticIndicatorData` utilities
  - Show theme synchronization with VitePress dark mode toggle:
    - Use VitePress `useData` composable to detect theme
    - Call chart's `updateTheme` method on theme change
  - Include complete working example Vue component for copy-paste usage
  - Document any VitePress-specific configuration needed

**Prepare for npm Publishing:**

- Verify `client/src/chartjs/financial/package.json` has all required metadata:
  - `name`, `version`, `description` fields are correct
- `keywords` for discoverability (chart.js, financial, candlestick, stock charts, technical analysis)
  - `repository`, `bugs`, `homepage` URLs
  - `license` field (e.g., MIT)
  - `author` information
- Create or update `.npmignore` or use `files` field to exclude:
  - Test files and specs
  - Source maps (unless desired)
  - Development artifacts and config files (tsconfig, etc.)
- Run `npm pack` and inspect contents to verify only necessary files are included
- Document the publishing process:
  - Manual: `npm publish` steps with authentication
  - CI-based: Outline automated release workflow (optional)
  - Version bumping strategy (semantic versioning)
  - Changelog maintenance recommendations
```

</details>
