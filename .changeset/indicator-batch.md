---
"@facioquo/indy-charts": minor
---

`ApiClient.getSelectionsData(requests)` fetches the rows for several selections with one `GET indicators/batch` request and returns one promise per request, in order. A server without the route, a failed item, or an unreadable response falls back to `getSelectionData` for the affected selections, and a `404` or `405` stops the client asking for the batch again. `endpoints.batch` overrides the route. The batch is an optional fourth operation in `backing-api.yml`; servers that do not implement it need no change.
