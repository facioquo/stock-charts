---
"@facioquo/indy-charts": minor
---

Ship `dist/backing-api.yml` and `dist/llms.txt`: the HTTP contract a self-hosted data source implements, and a guide to both halves of the package.

The API has always been optional — supply your own `Bar[]` and `IndicatorDataRow[]` and nothing makes a request. But pointing `createApiClient({ baseUrl })` at a server means meeting a specific shape, and that shape was discoverable only by reading the client's source.

`backing-api.yml` specifies the three operations the client calls and the schemas they exchange. It does not enumerate indicator routes: each catalog entry carries its own `endpoint` and `parameters`, so adding an indicator is a catalog change rather than an interface change.

`llms.txt` covers using the charts and hosting the backing API in one place, for coding agents working against the package.

```bash
npx @redocly/cli build-docs node_modules/@facioquo/indy-charts/dist/backing-api.yml
cat node_modules/@facioquo/indy-charts/dist/llms.txt
```
