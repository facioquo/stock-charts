---
"@facioquo/indy-charts": minor
---

`ApiClient.getSelectionsData(requests)` fetches the rows for several selections with one `GET indicators/batch` request and returns one promise per request, in order. A server without the route, a failed item, or an unreadable response falls back to `getSelectionData` for the affected selections, and a refusal (`404`, `405`, `400`, `413`, `414`) stops the client asking for the batch again. Lists longer than 20 are sent as several requests, and the batch gets one attempt before the fallback. `endpoints.batch` overrides the route. `getSelectionsData` is a required member of the `ApiClient` interface, so a custom implementation or test double must add it; delegating to `getSelectionData` for each request is enough. The batch is an optional fourth operation in `backing-api.yml`; servers that do not implement it need no change.
