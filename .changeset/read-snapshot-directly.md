---
"@facioquo/indy-charts": minor
---

`fetchOfflineSnapshot({ snapshotBaseUrl, apiBaseUrl, requestUrl })` reads one snapshot file without trying the live API first, for a page that already knows its origin is down. `requestUrl` is the absolute URL the live client would request, query string included, under `apiBaseUrl`. It resolves to `undefined` when the file is missing or unreadable, and to the parsed JSON, typed `unknown`, otherwise.
