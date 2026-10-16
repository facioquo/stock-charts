---
"@facioquo/indy-charts": minor
---

On charts 600 px wide or narrower, the overlay legend now sits in a block above the price plot instead of over it. Entries flow inline and wrap to new rows, each with a series-coloured swatch and a label in the theme text colour, and the chart gains top padding for the block. Wider charts keep the legend over the plot as before. In the block layout each legend entry is two annotations (`legendN` and `legendN-swatch`), so code that reads the annotations array sees the change.
