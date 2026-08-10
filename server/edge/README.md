# Edge worker

Cloudflare Worker that fronts the .NET indicator API container and refreshes quote datasets.

It has two responsibilities:

- **`fetch`** — answers CORS preflight, serves cached indicator/quote responses, and forwards
  misses to the API container ([../Dockerfile](../Dockerfile)). The cache is what keeps the
  container asleep, and therefore unbilled, most of the time.
- **`scheduled`** — pulls daily bars from Alpaca into R2. Replaces the former Azure Functions timer
  trigger. It never touches the container.

## Layout

| File | Purpose |
| :--- | :--- |
| [src/index.ts](src/index.ts) | Request pipeline: CORS → cache → container |
| [src/container.ts](src/container.ts) | `ApiContainer` config and the R2 outbound handler |
| [src/cors.ts](src/cors.ts) | Origin allow list and cache-safe CORS rewriting |
| [src/quotes.ts](src/quotes.ts) | Alpaca → R2 dataset refresh |
| [wrangler.jsonc](wrangler.jsonc) | Bindings, container instance type, cron schedule, vars |

## Caching and CORS

Cache entries are keyed by URL alone and stored with **all** CORS headers stripped; the correct
`Access-Control-Allow-Origin` is written per request on the way out. That is what lets a single
entry serve the demo site, the docs site, and preview deployments without one origin poisoning
another's cached copy (facioquo/stock-charts#517).

Responses carry `x-edge-cache: HIT|MISS` so the behaviour is visible in browser devtools.

## Storage access

The container holds no storage credentials. It fetches `http://quotes.r2/QQQ-DAILY.json`, and the
`outboundByHost` handler in [src/container.ts](src/container.ts) translates that into an R2 binding
call inside the Workers runtime. `enableInternet` is off — R2 is the container's only outbound
dependency.

## Dataset contract

`src/quotes.ts` writes **PascalCase** keys. The API deserializes with default, case-sensitive
`JsonSerializerOptions`, so camelCase would silently produce default-valued bars.
[../quote-dataset.contract.json](../quote-dataset.contract.json) is asserted from both sides —
here in [src/quotes.spec.ts](src/quotes.spec.ts) and in
[../WebApi.Tests/Services/QuoteDatasetContractTests.cs](../WebApi.Tests/Services/QuoteDatasetContractTests.cs).

## Local development

Unit tests need nothing but Node:

```bash
pnpm --filter @stock-charts/edge run test
```

Running the Worker together with the container needs Docker:

```bash
pnpm run edge:dev     # Worker + container on http://localhost:8787
```

> **Windows:** wrangler does not support local container development on Windows — it fails with
> _"Local development with containers is currently not supported on Windows. You should use WSL
> instead."_ Either run `pnpm run edge:dev` from a WSL shell, or use the container-only workflow
> below, which covers everything except the Worker layer.

Smoke checks against `edge:dev`:

```bash
curl -s localhost:8787/                                    # "API is functioning nominally."
curl -s "localhost:8787/RSI?lookbackPeriods=14" | head -c 200
curl -si -H "Origin: https://stock-charts-vitepress.pages.dev" localhost:8787/quotes \
  | grep -i -e access-control -e x-edge-cache
curl -si -X OPTIONS -H "Origin: https://stock-charts-vitepress.pages.dev" \
  -H "Access-Control-Request-Method: GET" localhost:8787/quotes   # 204, container stays asleep
```

To exercise the cron locally, run `wrangler dev --test-scheduled` and request `/__scheduled`.

### Container-only workflow

Works on any platform with Docker, and exercises the exact image that gets deployed. Useful for
verifying the API's container behaviour (no HTTPS-redirect loop, `Cache-Control`, quote fetching)
without the Worker in front.

```bash
# Build the image wrangler would build
docker build -t stock-charts-api ..

# Backup-data mode: no reachable quote host, so the bundled dataset is served
docker run --rm -p 127.0.0.1:8080:8080 stock-charts-api
curl -si localhost:8080/quotes | head -12       # 200, Cache-Control: public, max-age=900

# Live-data mode: point at any host serving {SYMBOL}-DAILY.json
docker run --rm -p 127.0.0.1:8080:8080 \
  -e "Quotes__BaseUrl=http://your-quote-host/" \
  -e "Api__PublicBaseUrl=https://charts-api.stockindicators.dev" \
  stock-charts-api
```

The API also runs without Docker at all (`cd ../WebApi && dotnet run`); with no reachable quote
host it serves its bundled backup dataset.

## Deployment

CI deploys on pushes to `main` ([../../.github/workflows/deploy-website.yml](../../.github/workflows/deploy-website.yml)).
Manual deploy:

```bash
pnpm run edge:deploy
```

### One-time account setup

```bash
wrangler r2 bucket create stock-charts-quotes
pnpm --filter @stock-charts/edge exec wrangler secret put ALPACA_KEY
pnpm --filter @stock-charts/edge exec wrangler secret put ALPACA_SECRET
```

The `CLOUDFLARE_API_TOKEN` repository secret needs **Workers Scripts**, **Containers**, and **R2**
edit permissions — broader than the Pages-only scope it previously required. `CLOUDFLARE_ACCOUNT_ID`
is unchanged.

Containers require the **Workers Paid** plan ($5/month minimum).

### Configuration to review

| Setting | Where | Notes |
| :--- | :--- | :--- |
| `PUBLIC_BASE_URL` | [wrangler.jsonc](wrangler.jsonc) | The Worker's custom domain (`charts-api.stockindicators.dev`), so `/indicators` emits reachable absolute endpoint URLs. Must match the `routes` entry |
| `ALLOWED_ORIGINS` | [wrangler.jsonc](wrangler.jsonc) | Production CORS allow list. Supports `*.` subdomain wildcards for preview deployments |
| Production API URL | `web/src/config/env.ts`, `tests/vitepress/.vitepress/theme/index.ts`, `tests/playwright/vitepress.spec.ts` | Must match the deployed Worker hostname. CI's backup-indicator snapshot reads the `INDICATORS_API_BASE` repository variable, which overrides the workflow default |
| `Caching:DurationMinutes` | `../WebApi/appsettings.json` | Drives the API's `max-age`, which is what the Worker cache honours |

### First cutover

1. Create the R2 bucket and set the Alpaca secrets (above).
2. Deploy the Worker and container. The `charts-api.stockindicators.dev` custom domain in
   `routes` is provisioned automatically — the zone lives in the same account, so the DNS
   record and certificate are created by the deploy (`workers_dev` is off; the custom domain
   is the only public host).
3. Seed R2 by triggering the cron once (`wrangler dev --test-scheduled`, or wait for the schedule).
   Until it runs, `/quotes` correctly serves the bundled 2018 backup dataset.
4. Verify against `https://charts-api.stockindicators.dev` before pointing the site at it:
   - a repeat request returns `x-edge-cache: HIT` and does not restart the container;
   - load the Pages site and the VitePress demo back to back in one browser and confirm neither
     poisons the other's cached `/quotes` (the failure mode in facioquo/stock-charts#517);
   - `wrangler tail` shows the cron firing and `SPY-DAILY.json` / `QQQ-DAILY.json` landing in R2;
   - the Containers dashboard shows the instance sleeping after ~10 minutes idle.
5. Deploy the site, then leave the old origin running for about a week — already-loaded browser
   bundles still point at it — before decommissioning.
