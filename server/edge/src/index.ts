import { getContainer } from "@cloudflare/containers";

import { ApiContainer } from "./container";
import { applyCors, preflightResponse, resolveAllowedOrigin, stripCors } from "./cors";
import type { Env } from "./env";
import { refreshQuotes } from "./quotes";

export { ApiContainer };
// wrangler ≥4.120 wires the container's proxy image through
// `ctx.exports.ContainerProxy`; without this re-export the container fails to
// start with "ctx.exports.ContainerProxy is undefined".
export { ContainerProxy } from "@cloudflare/containers";

/**
 * Every request routes to the same container instance. Indicator computation is
 * stateless, so pinning keeps the container's in-memory quote cache hot and
 * holds billable container time to a single instance.
 */
const INSTANCE = "api";

/** Surfaced on responses so cache behaviour is observable in the browser. */
const CACHE_STATUS = "x-edge-cache";

/**
 * Only responses the API explicitly marks as shared-cacheable are stored. The
 * API sets `Cache-Control: public, max-age=...` on quote and indicator
 * responses; anything else (errors, the health check) goes straight through.
 */
function isCacheable(response: Response): boolean {
  if (response.status !== 200) {
    return false;
  }

  const cacheControl = response.headers.get("cache-control") ?? "";
  return cacheControl.includes("public") && cacheControl.includes("max-age=");
}

/**
 * Forwards to the container without `Accept-Encoding`, so the API answers
 * uncompressed and a single cache entry cannot be a mismatched encoding for the
 * next client. Cloudflare compresses on the way out to the browser.
 */
function upstreamRequest(request: Request): Request {
  const forwarded = new Request(request);
  forwarded.headers.delete("accept-encoding");
  return forwarded;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const allowedOrigin = resolveAllowedOrigin(request.headers.get("Origin"), env.ALLOWED_ORIGINS);

    // Preflight is answered here; the container stays asleep.
    if (request.method === "OPTIONS") {
      return preflightResponse(allowedOrigin);
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      const rejected = new Response("Method not allowed", { status: 405 });
      applyCors(rejected.headers, allowedOrigin);
      return rejected;
    }

    // Cache key is the URL alone — deliberately not the Origin. Entries are
    // stored with all CORS headers stripped, and the correct
    // Access-Control-Allow-Origin is written per request on the way out, so one
    // entry serves every allowed origin without cross-origin poisoning.
    const cache = caches.default;
    const cacheKey = new Request(request.url, { method: "GET" });

    const hit = await cache.match(cacheKey);

    if (hit !== undefined) {
      // The cache entry was written from a GET response and always carries a
      // body. A HEAD request must not echo it back.
      const response = new Response(request.method === "HEAD" ? null : hit.body, hit);
      response.headers.set(CACHE_STATUS, "HIT");
      applyCors(response.headers, allowedOrigin);
      return response;
    }

    let upstream: Response;

    try {
      upstream = await getContainer(env.API, INSTANCE).fetch(upstreamRequest(request));
    } catch (error) {
      // Without CORS headers here, a container that failed to start surfaces in
      // the browser as an opaque CORS error rather than the actual fault.
      console.error("Container request failed", error);
      const failed = new Response("Upstream API unavailable", { status: 502 });
      applyCors(failed.headers, allowedOrigin);
      return failed;
    }

    const response = new Response(upstream.body, upstream);
    stripCors(response.headers);

    // GET only. A HEAD response has no body, and storing it under the
    // body-less GET key would starve every subsequent GET of its payload.
    if (request.method === "GET" && isCacheable(response)) {
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }

    response.headers.set(CACHE_STATUS, "MISS");
    applyCors(response.headers, allowedOrigin);
    return response;
  },

  // Awaited rather than fire-and-forget so a failed refresh is reported as a
  // failed cron invocation instead of disappearing into a detached promise.
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    await refreshQuotes(env);
  }
};
