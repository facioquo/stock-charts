---
"@facioquo/indy-charts": patch
---

`<StockIndicatorChart>` now applies the `background` and `with` set on an `indicators` registry entry. Before, only the values passed through the `config` prop or the component's own props took effect, and a registry entry's were silently ignored. The props and the `config` prop still take precedence.
