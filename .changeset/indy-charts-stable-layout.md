---
"@facioquo/indy-charts": minor
---

`<StockIndicatorChart>` now holds its place on the page while it loads. It renders its sized chart frames on mount, before any data arrives: the price frame, plus one oscillator frame for each indicator known to be an oscillator. Loading and error messages sit over those frames instead of above them, so content below no longer jumps when the chart draws.

Pane types come from the `/indicators` listings when they are already loaded. Otherwise `withOverlay` implies an oscillator. A new optional `chartType: "overlay" | "oscillator"` on a registry entry or `config` makes the first, uncached view exact.

Quote and listing responses are now shared, per URL, by every client the package creates. Several charts on one page make one `GET /quotes` and one `GET /indicators` between them, and later calls reuse the result. A failed request is not kept, and the `staleCache` fallback is unchanged. The new `clearApiClientCache()` export forces a refetch.

Each chart canvas now has `role="img"` and an accessible name built from the indicator title, and the loading and error messages have `role="status"`.
