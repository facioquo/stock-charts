---
"@facioquo/indy-charts": minor
---

`<StockIndicatorChart>` now holds its place on the page while it loads. It renders its sized chart frames on mount, before any data arrives: the price frame, plus one oscillator frame for each indicator known to be an oscillator. Loading and error messages sit over those frames instead of above them, so content below no longer jumps when the chart draws.

Pane types come from the `/indicators` listings when they are already loaded. Otherwise `withOverlay` implies an oscillator. A new optional `chartType: "overlay" | "oscillator"` on a registry entry or `config` makes the first, uncached view exact.

Quote and listing responses are now shared, per URL, by every client the package creates. Several charts on one page make one `GET /quotes` and one `GET /indicators` between them, and later calls reuse the result for the page's lifetime. A failed request is not kept. Because a settled response is reused, the `staleCache` fallback now applies only to a fetch that starts after a failed fetch or after `clearApiClientCache()`, which forces a refetch. The first caller's retry settings govern a shared request.

Each chart canvas now has `role="img"` and an accessible name built from the indicator title, and the loading and empty messages have `role="status"` and the error message has `role="alert"`, so a failure is announced immediately.
