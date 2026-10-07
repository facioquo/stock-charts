# @facioquo/indy-charts

## 0.13.1

### Patch Changes

- 3cf6303: `getSelectionsData` matches batch items to requests by the `selection` each item echoes, so a response that arrives in a different order no longer fills a chart with another indicator's rows. A server that echoes nothing is still read in request order. `backing-api.yml` documents the optional `selection` field on each batch item.

## 0.13.0

### Minor Changes

- 10c1db2: `ApiClient.getSelectionsData(requests)` fetches the rows for several selections with one `GET indicators/batch` request and returns one promise per request, in order. A server without the route, a failed item, or an unreadable response falls back to `getSelectionData` for the affected selections, and a refusal (`404`, `405`, `400`, `413`, `414`) stops the client asking for the batch again. Lists longer than 20 are sent as several requests, and the batch gets one attempt before the fallback. `endpoints.batch` overrides the route. `getSelectionsData` is a required member of the `ApiClient` interface, so a custom implementation or test double must add it; delegating to `getSelectionData` for each request is enough. The batch is an optional fourth operation in `backing-api.yml`; servers that do not implement it need no change.
- 2539852: `ChartManager.reorderSelections(ucids)` sets the order of the registered selections. For overlay indicators the order is the layering: earlier selections draw over later ones with the same `order`. Bands such as Bollinger Bands carry a higher `order` than lines and stay behind them. Oscillator canvases are the caller's to order.

## 0.12.0

### Minor Changes

- bc8733b: The API client can now fall back to a static snapshot shipped with the consuming site, so charts render when the API is gone for good and the visitor has no cached copy. Pass `offlineFallback: { baseUrl }` to `createApiClient`, and `onOffline` to learn when snapshot data is served. The order is the live request, then `staleCache`, then the snapshot, then the original error.
  
  `createOfflineSnapshot(config, { selections? })` builds the snapshot at build time: it returns the files, at the paths the fallback reads, for the quotes, the indicator listings, and every catalog indicator at its default parameters.
  
  Snapshot files are tied to the package version that wrote them. Regenerate them when upgrading.

## 0.11.0

### Minor Changes

- 9a4f962: `<StockIndicatorChart>` now holds its place on the page while it loads. It renders its sized chart frames on mount, before any data arrives: the price frame, plus one oscillator frame for each indicator known to be an oscillator. Loading and error messages sit over those frames instead of above them, so content below no longer jumps when the chart draws.
  
  Pane types come from the `/indicators` listings when they are already loaded. Otherwise `withOverlay` implies an oscillator. A new optional `chartType: "overlay" | "oscillator"` on a registry entry or `config` makes the first, uncached view exact.
  
  Quote and listing responses are now shared, per URL, by every client the package creates. Several charts on one page make one `GET /quotes` and one `GET /indicators` between them, and later calls reuse the result for the page's lifetime. A failed request is not kept. A call answered from a settled response never reaches the `staleCache` fallback; a fetch that goes out (the page's first, one after a failure, or one after `clearApiClientCache()`, which forces a refetch) still does. The first caller's retry settings govern a shared request.
  
  Each chart canvas now has `role="img"` and an accessible name built from the indicator title, and the loading and empty messages have `role="status"` and the error message has `role="alert"`, so a failure is announced immediately.

## 0.10.0

### Minor Changes

- bde9258: Ship `dist/backing-api.yml` and `dist/llms.txt`: the HTTP contract a self-hosted data source implements, and a guide to both halves of the package.
  
  The API has always been optional — supply your own `Bar[]` and `IndicatorDataRow[]` and nothing makes a request. But pointing `createApiClient({ baseUrl })` at a server means meeting a specific shape, and that shape was discoverable only by reading the client's source.
  
  `backing-api.yml` specifies the three operations the client calls and the schemas they exchange. It does not enumerate indicator routes: each catalog entry carries its own `endpoint` and `parameters`, so adding an indicator is a catalog change rather than an interface change.
  
  `llms.txt` covers using the charts and hosting the backing API in one place, for coding agents working against the package.
  
  ```bash
  npx @redocly/cli build-docs node_modules/@facioquo/indy-charts/dist/backing-api.yml
  cat node_modules/@facioquo/indy-charts/dist/llms.txt
  ```
