---
"@facioquo/indy-charts": minor
---

Add `showSeriesLegend` to `ChartSettings` to name each line of a multi-line oscillator pane, such as ADX or MACD. The indicator label is followed by a series-coloured swatch and label for each line, wrapping onto more rows on a narrow pane. When a line is labelled like the indicator, such as `ADX(14)`, its entry stands in for the indicator label. It is off unless set; in the Vue adapter, set `defaults.showSeriesLegend: true`. Single-line panes keep the indicator label alone.

With it on, a multi-line pane's `options.plugins.annotation.annotations` is an array rather than the `{ annotation }` object, so code that reads `annotations.annotation` should look entries up by `id` instead. The indicator label has the id `legend`, and each line adds `legendN` and `legendN-swatch`, numbered from 1 in result order. When a line is labelled like the indicator, such as ADX, there is no `legend` entry; that line's `legendN` carries the name.
