# Task 4: Implement API Client and LocalStorage Caching in Library

## Scope & Objective

Add optional HTTP client for fetching quotes/indicators and built-in localStorage caching for chart state persistence.

**In scope**:

- Create `api/` directory in library
- Implement `createApiClient(baseUrl)` factory
- Implement fetch methods (fetchQuotes, fetchIndicatorListings, fetchIndicatorData)
- Add localStorage integration to ChartManager
- Add SSR guards (skip caching if window undefined)
- Support both static data and dynamic fetching

**Out of scope**:

- Backend API changes
- Error handling UI (consumer responsibility)
- Cache migration logic

## References

**From Analysis** (spec: [Chart System Extraction (analysis)](01-analysis.md)):

- Section 1: Dependencies - "ApiService - fetches quotes and indicator data"
- Section 2: Risk Hotspots - "LocalStorage Serialization"

**From Approach** (spec: [Chart System Extraction (approach)](02-approach.md)):

- Section 1: Design Decisions - "Built-in LocalStorage Caching"
- Section 1: Design Decisions - "Optional HTTP Client for API Integration"
- Section 1: Design Decisions - "Indicator-Aware Library"

## Guardrails

**Preserve data format contracts** (Approach §4):

- Quote interface (date, OHLCV fields)
- IndicatorListing interface (matches backend API)
- IndicatorDataRow interface (matches backend API)
- LocalStorage format (backward compatible with current cache)

**API client requirements**:

- Use native fetch API (no external HTTP library)
- Transform date strings to Date objects
- Handle errors gracefully (return fallback data or throw)
- Support configurable base URL

**Caching requirements**:

- SSR-safe (check `typeof window !== 'undefined'`)
- Serialize chart state (selections, parameters)
- Exclude Chart.js instances from serialization
- Provide `enableCaching(key)` and `restoreState()` methods

## Acceptance Criteria

- [ ] Created client/src/chartjs/financial/api/models.ts with Quote, RawQuote, IndicatorListing, IndicatorDataRow interfaces
- [ ] Created client/src/chartjs/financial/api/client.ts with `createApiClient()` factory
- [ ] Implemented `fetchQuotes()` - returns `Promise<Quote[]>`, transforms dates
- [ ] Implemented `fetchIndicatorListings()` - returns `Promise<IndicatorListing[]>`
- [ ] Implemented `fetchIndicatorData(endpoint, params)` - returns `Promise<IndicatorDataRow[]>`
- [ ] Added `ChartManager.enableCaching(key)` method
- [ ] Added `ChartManager.restoreState()` method
- [ ] Caching skips if window undefined (SSR-safe)
- [ ] Backward compatible with existing localStorage format

## Verification Steps

1. Test API client with real backend:

   ```typescript
   const client = createApiClient("https://localhost:5001");
   const quotes = await client.fetchQuotes();
   ```

2. Verify quotes have Date objects (not strings)
3. Test caching:

   ```typescript
   manager.enableCaching("test-key");
   manager.addOscillator("RSI", { period: 14 });
   manager.restoreState(); // should restore RSI
   ```

4. Verify localStorage contains serialized state
5. Test SSR safety (mock window as undefined)
6. Verify existing Angular app cache loads correctly
