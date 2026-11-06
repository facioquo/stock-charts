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
| [src/index.ts](src/index.ts) | Request pipeline: CORS → route check → cache → shared cache → container |
| [src/shared-cache.ts](src/shared-cache.ts) | Shared R2 response cache and its validity rule |
| [src/routes.ts](src/routes.ts) | Routes the API serves, and the edge `robots.txt` |
| [src/container.ts](src/container.ts) | `ApiContainer` config and the R2 outbound handler |
| [src/cors.ts](src/cors.ts) | Origin allow list and cache-safe CORS rewriting |
| [src/quotes.ts](src/quotes.ts) | Alpaca → R2 dataset refresh |
| [wrangler.jsonc](wrangler.jsonc) | Bindings, container instance type, cron schedule, vars |

## Caching and CORS

Cache entries are keyed by URL alone and stored with **all** CORS headers stripped; the correct
`Access-Control-Allow-Origin` is written per request on the way out. That is what lets a single
entry serve the demo site, the docs site, and preview deployments without one origin poisoning
another's cached copy (facioquo/stock-charts#517).

The Worker cache is local to each Cloudflare location. Behind it sits a shared tier in R2, under
the `responses/` prefix of the quotes bucket ([src/shared-cache.ts](src/shared-cache.ts)), so one
computed response serves every location. A shared entry is served while it is younger than its
`max-age`, as the Worker cache would, and after that for as long as the quote datasets stay
unchanged. It counts as unchanged once it was computed at least two `max-age` windows after the
newest dataset upload, because the API's own quote and output caches can each hold older data for
one window. Overnight, after the close, and over weekends, a repeat request is therefore served
without the container, while a new bar still reaches charts as quickly as before.

A shared hit is served with its `max-age` cut to the time the entry has left, and the location
keeps its own copy for that long. An entry that is still unchanged gets a full window each time.

Keys start with the deployed Worker version id (the `CF_VERSION_METADATA` binding), so a deploy
never serves responses an earlier API build computed. The API marks any response computed from
its bundled backup quotes `no-store`, so a storage outage is never replayed from the shared tier.

Responses carry `x-edge-cache: HIT|SHARED|MISS` so the behaviour is visible in browser devtools.

Shared entries are never deleted by the Worker. A bucket lifecycle rule removes them; it is a
one-time operator step in [First cutover](#first-cutover).

## Dataset freshness

`/quotes` responses carry `X-Quotes-As-Of`, the newest bar's UTC timestamp, set by the API and
exposed to cross-origin scripts. A dataset is stale once it misses two weekdays after its newest
bar; one is allowed so a market holiday is not an alarm.

Two checks report it, and both log `Stale quote dataset`:

- **The scheduled refresh** reads each stored dataset back after writing and fails the
  invocation when one is stale, missing, or empty. That catches a run that succeeds but leaves a
  symbol behind.
- **The fetch path** logs when a container response or a shared cache hit serves a stale
  `/quotes`. That catches a refresh that never runs at all, which the first check cannot see.
  Per-location cache hits are not checked, so each location logs at most once per window.

A run writes a dataset only when its content changed, so an R2 object's upload time is when its
data last changed, not when the cron last ran. Look for `Unchanged dataset` or `Updated dataset`
in the scheduled invocation's logs to confirm runs.

## Unknown paths and crawlers

The Worker refuses any path the API does not serve with a `404` before the cache, the rate limiter,
or the container, so scanners probing paths like `/wp-login.php` never wake the container. The API's
fixed routes match without regard to case; indicator routes must be the catalog's uppercase ids.
`src/routes.spec.ts` checks every `[HttpGet]` route in the controller passes.

`/robots.txt` is answered at the edge and disallows everything. The API serves chart data, not
pages, so crawlers have nothing to index there.

## Rate limiting

Cache **misses** are rate limited per client IP (120/minute via the Workers `ratelimits`
binding); over-limit requests get a `429` with `Retry-After` instead of waking the container.
Cache hits are never throttled — they cost nothing, while unique query strings could otherwise
bypass the cache at will and keep the billable container awake. Counting is per-Cloudflare-location
and eventually consistent: an abuse damper, not an accounting system. The Workers binding is used
instead of a zone WAF rule because the zone's Free plan cannot scope rules to this hostname.

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

The `CLOUDFLARE_API_TOKEN` repository secret needs these permissions (verified empirically on
the first production deploy — each one gated a different step):

- **Account** — Workers Scripts: Edit (script upload), Containers: Edit (container registration),
  Cloudflare Pages: Edit (site deploy)
- **Zone** (`stockindicators.dev`) — Workers Routes: Edit (the `charts-api` custom-domain route);
  DNS: Edit is only needed if the custom-domain DNS record must be (re)provisioned

R2 permissions are **not** required: the deploy only attaches the bucket binding as script
metadata, and runtime access goes through the Worker's binding, never this token.
`CLOUDFLARE_ACCOUNT_ID` is unchanged.

Containers require the **Workers Paid** plan ($5/month minimum).

### Configuration to review

| Setting | Where | Notes |
| :--- | :--- | :--- |
| `PUBLIC_BASE_URL` | [wrangler.jsonc](wrangler.jsonc) | The Worker's custom domain (`charts-api.stockindicators.dev`), so `/indicators` emits reachable absolute endpoint URLs. Must match the `routes` entry |
| `ALLOWED_ORIGINS` | [wrangler.jsonc](wrangler.jsonc) | Production CORS allow list. Supports `*.` subdomain wildcards for preview deployments |
| Production API URL | `web/src/config/env.ts`, `tests/vitepress/.vitepress/theme/index.ts`, `tests/playwright/vitepress.spec.ts` | Must match the deployed Worker hostname. The offline snapshot generator (`pnpm run generate:offline-snapshot`) reads `INDICATORS_API_BASE` on a manual run |
| `Caching:DurationMinutes` | `../WebApi/appsettings.json` | Drives the API's `max-age`, which is what the Worker cache honours |

### First cutover

1. Create the R2 bucket and set the Alpaca secrets (above).
2. Deploy the Worker and container. The `charts-api.stockindicators.dev` custom domain in
   `routes` is provisioned automatically — the zone lives in the same account, so the DNS
   record and certificate are created by the deploy (`workers_dev` is off; the custom domain
   is the only public host).
3. Add the lifecycle rule that expires shared response cache entries, once per bucket:

   ```bash
   pnpm --filter @stock-charts/edge exec wrangler r2 bucket lifecycle add stock-charts-quotes \
     expire-responses responses/ --expire-days 7
   ```

4. Seed R2 by triggering the cron once (`wrangler dev --test-scheduled`, or wait for the schedule).
   Until it runs, `/quotes` correctly serves the bundled 2018 backup dataset.
5. Verify against `https://charts-api.stockindicators.dev` before pointing the site at it:
   - a repeat request returns `x-edge-cache: HIT` and does not restart the container;
   - load the Pages site and the VitePress demo back to back in one browser and confirm neither
     poisons the other's cached `/quotes` (the failure mode in facioquo/stock-charts#517);
   - `wrangler tail` shows the cron firing and `SPY-DAILY.json` / `QQQ-DAILY.json` landing in R2;
   - the Containers dashboard shows the instance sleeping after ~10 minutes idle.
6. Deploy the site, then leave the old origin running for about a week — already-loaded browser
   bundles still point at it — before decommissioning.
