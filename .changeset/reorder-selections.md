---
"@facioquo/indy-charts": minor
---

`ChartManager.reorderSelections(ucids)` sets the order of the registered selections. For overlay indicators the order is the layering: earlier selections draw over later ones with the same `order`. Bands such as Bollinger Bands carry a higher `order` than lines and stay behind them. Oscillator canvases are the caller's to order.
