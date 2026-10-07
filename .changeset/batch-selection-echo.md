---
"@facioquo/indy-charts": patch
---

`getSelectionsData` matches batch items to requests by the `selection` each item echoes, so a response that arrives in a different order no longer fills a chart with another indicator's rows. A server that echoes nothing is still read in request order. `backing-api.yml` documents the optional `selection` field on each batch item.
