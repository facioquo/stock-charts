---
"@facioquo/indy-charts": minor
---

Add `showSeriesLegend` to `ChartSettings` to name each line of a multi-line oscillator pane, such as ADX or MACD. The indicator label is followed by a series-coloured swatch and label for each line, wrapping onto more rows on a narrow pane. When a line is labelled like the indicator, such as `ADX(14)`, its entry stands in for the indicator label. It is off unless set; in the Vue adapter, set `defaults.showSeriesLegend: true`. Single-line panes keep the indicator label alone. With it on, each line's entry is two annotations (`legendN` and `legendN-swatch`), so code that reads a multi-line pane's annotations sees the change.
