# @facioquo/indy-charts

## 0.17.1

### Patch Changes

- 40be93a: `<StockIndicatorChart>` now applies the `background` and `with` set on an `indicators` registry entry. Before, only the values passed through the `config` prop or the component's own props took effect, and a registry entry's were silently ignored. The props and the `config` prop still take precedence.

## 0.17.0

### Minor Changes

- 8f374fb: The volume bars under the price chart now carry a value scale: one abbreviated label, such as `5M`, in the right-hand column with the price labels. It follows `showRightAxisLabels`, so hiding the right-axis labels hides it too.

## 0.16.0

### Minor Changes

- 43f8e86: On charts 600 px wide or narrower, the overlay legend now sits in a block above the price plot instead of over it. Entries flow inline and wrap to new rows, each with a series-coloured swatch and a label in the theme text colour, and the chart gains top padding for the block. Wider charts keep the legend over the plot as before. In the block layout each legend entry is two annotations (`legendN` and `legendN-swatch`), so code that reads the annotations array sees the change.

## 0.15.0

### Minor Changes

- 7e087b4: Tooltips are off by default in the Vue adapter. Set `defaults.showTooltips: true` in `setupIndyChartsForVue` to keep them on.
- 7c72f17: Add a visible-window API to `ChartManager`: `setWindow(start, count)`, `panBy(bars)`, and `zoomBy(factor, anchor?)` show any run of bars, not only the newest ones. Overlay and oscillator panes slice to the same window and each y-axis rescales to the visible bars. `windowOffset` reports how many bars the window sits behind the newest bar, 0 when anchored to it, and `windowStart` the history index of its first bar. `setBarCount` still re-anchors to the newest bar, and now also refits the volume axis to the visible bars.
- 626ea19: Export `MIN_BARS`, `clampWindow`, and the `BarWindow` type so a caller can read the window a request will become before applying it with `setWindow`. The visible-window API removes the 250-bar ceiling for a window, so no maximum constant is published.

### Patch Changes

- e2c9466: List the overlay legend in the order of the indicator list, instead of alphabetically by label.

## 0.14.1

### Patch Changes

- 1d5ea49: Show every indicator line at the hovered bar in a chart's tooltip, so overlays read against the candle, and title daily bars with the date only. Thresholds and hidden `none` series stay out of the tooltip. The demo app now shows tooltips by default for every visitor who has not switched them off themselves. A visitor who switched them off before this release gets them on once and can switch them off again.

## 0.14.0

### Minor Changes

- 246a920: `fetchOfflineSnapshot({ snapshotBaseUrl, apiBaseUrl, requestUrl })` reads one snapshot file without trying the live API first, for a page that already knows its origin is down. `requestUrl` is the absolute URL the live client would request, query string included, under `apiBaseUrl`. It resolves to `undefined` when the file is missing or unreadable, and to the parsed JSON, typed `unknown`, otherwise.

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
