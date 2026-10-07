---
"@facioquo/indy-charts": minor
---

`fetchOfflineSnapshot(snapshotBaseUrl, apiBaseUrl, requestUrl)` reads one snapshot file without trying the live API first, for a page that already knows its origin is down. It resolves to `undefined` when the file is missing or unreadable.
