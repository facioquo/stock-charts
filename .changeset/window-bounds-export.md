---
"@facioquo/indy-charts": minor
---

Export `MIN_BARS`, `clampWindow`, and the `BarWindow` type so a caller can read the window a request will become before applying it with `setWindow`. The visible-window API removes the 250-bar ceiling for a window, so no maximum constant is published.
