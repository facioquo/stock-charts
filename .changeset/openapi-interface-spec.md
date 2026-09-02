---
"@facioquo/indy-charts": minor
---

Ship `openapi.yml`, describing the HTTP interface the built-in API client expects.

The API has always been optional — you can supply your own `Bar[]` and `IndicatorDataRow[]` and never make a request. But if you do point `createApiClient({ baseUrl })` at a server, it expects a specific shape, and until now that shape was only discoverable by reading the client's source or diffing responses from the reference server.

The specification covers the three operations the client calls (`GET /quotes`, `GET /indicators`, and the catalog-driven indicator endpoint) and the schemas they exchange. It does not enumerate indicator routes: each catalog entry carries its own `endpoint` and `parameters`, so adding an indicator is a catalog change rather than an interface change.

Preview it with `npx @redocly/cli preview-docs node_modules/@facioquo/indy-charts/openapi.yml`.
