---
"@facioquo/indy-charts": minor
---

Add a visible-window API to `ChartManager`: `setWindow(start, count)`, `panBy(bars)`, and `zoomBy(factor, anchor?)` show any run of bars, not only the newest ones. Overlay and oscillator panes slice to the same window and each y-axis rescales to the visible bars. `windowOffset` reports how many bars the window sits behind the newest bar, 0 when anchored to it, and `windowStart` the history index of its first bar. `setBarCount` still re-anchors to the newest bar, and now also refits the volume axis to the visible bars.
