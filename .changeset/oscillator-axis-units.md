---
"@facioquo/indy-charts": patch
---

Oscillator y-axis labels now share one unit, the largest one the axis reaches. A pane reaching 15 million labels its ticks 5M, 10M and 15M, where it previously mixed 5000K and 15M, and one reaching 3 billion reads 3B rather than 3000M.
