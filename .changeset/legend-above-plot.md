---
"@facioquo/indy-charts": minor
---

The overlay legend now sits in a block above the price plot instead of over it. Entries flow inline and wrap to new rows at narrow widths, each with a series-coloured swatch and a label in the theme text colour. The chart gains top padding for the legend block, and each overlay legend entry is now two annotations (`legendN` and `legendN-swatch`), so code that reads the annotations array sees the change.
