---
"@facioquo/indy-charts": minor
---

The API client can now fall back to a static snapshot shipped with the consuming site, so charts render when the API is gone for good and the visitor has no cached copy. Pass `offlineFallback: { baseUrl }` to `createApiClient`, and `onOffline` to learn when snapshot data is served. The order is the live request, then `staleCache`, then the snapshot, then the original error.

`createOfflineSnapshot(config, { selections? })` builds the snapshot at build time: it returns the files, at the paths the fallback reads, for the quotes, the indicator listings, and every catalog indicator at its default parameters.

Snapshot files are tied to the package version that wrote them. Regenerate them when upgrading.
