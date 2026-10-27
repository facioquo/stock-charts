---
"@facioquo/indy-charts": patch
---

Oscillator y-axis labels now share one unit, the largest one the drawn labels reach. A pane whose labels reach 15 million reads 15M, 10M and 5M, where it previously mixed 15M with 10000K and 5000K. Labels in the billions read 2B rather than 2000M, and an axis below 10,000 keeps plain numbers.
