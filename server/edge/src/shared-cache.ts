/**
 * Shared response cache in R2, checked after the per-location Worker cache
 * misses and before the container is woken.
 *
 * `caches.default` is local to each Cloudflare location, so the same chart
 * request from forty locations would otherwise wake the container forty times.
 * One entry here serves every location, and it stays valid for as long as the
 * quote datasets it was computed from stay unchanged, so overnight, after the
 * close, and over weekends a repeat request is served without the container.
 */

import type { Env } from "./env";
import { datasetKey } from "./quotes";

/** R2 key prefix for cached responses, kept apart from the quote datasets. */
export const SHARED_PREFIX = "responses/";

/** Response headers worth replaying; CORS headers are stripped before storing. */
const STORED_HEADERS = ["content-type", "cache-control", "vary", "x-quotes-as-of"];

/** `max-age` of a `Cache-Control` value, in milliseconds, or null when absent. */
export function maxAgeMs(cacheControl: string | null): number | null {
  const match = /(?:^|[\s,])max-age=(\d+)/.exec(cacheControl ?? "");
  return match === null ? null : Number(match[1]) * 1000;
}

/**
 * How much longer an entry computed at `computedAt` may be served, in
 * milliseconds; zero or less means it may not.
 *
 * An entry computed at least two `maxAge` windows after the newest dataset
 * change is provably computed from the current data, and gets a full window
 * each time it is served. The API caches quotes in memory, and computed
 * responses in its output cache, for `maxAge` each, so a response can reflect
 * quotes read up to two windows before it was computed. Any other entry is
 * served only for what remains of its own window, as the per-location cache
 * would serve it.
 */
export function freshFor(
  computedAt: number,
  maxAge: number,
  lastQuoteChange: number,
  now: number
): number {
  return computedAt >= lastQuoteChange + 2 * maxAge ? maxAge : computedAt + maxAge - now;
}

/**
 * When any configured quote dataset last changed, in epoch milliseconds. The
 * scheduled refresh writes a dataset only when its content changes, so the
 * object's upload time is that moment. A missing dataset counts as never
 * changed: the API then serves its bundled backup and marks those responses
 * `no-store`, so none of them reach this cache.
 */
export async function lastQuoteChange(env: Env): Promise<number> {
  const symbols = env.QUOTE_SYMBOLS.split(",")
    .map(symbol => symbol.trim().toUpperCase())
    .filter(symbol => symbol.length > 0);

  const objects = await Promise.all(symbols.map(symbol => env.QUOTES.head(datasetKey(symbol))));

  return Math.max(0, ...objects.map(object => object?.uploaded.getTime() ?? 0));
}

/**
 * R2 key for a request URL under the deployed Worker version. Each deploy can
 * change the API and so the responses, so entries from an earlier version are
 * never read again; the bucket's lifecycle rule removes them. The URL is hashed
 * because a batch URL can exceed R2's key limit.
 */
export async function sharedKey(url: URL, version: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(url.pathname + url.search)
  );
  const hex = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  return `${SHARED_PREFIX}${version}/${hex}`;
}

/**
 * Returns the stored response for `key` when it may still be served. Its
 * `max-age` is cut to the time it has left, so neither a browser nor the
 * location that copies it holds it past that.
 */
export async function readShared(
  env: Env,
  key: string,
  now: number
): Promise<Response | undefined> {
  const [object, changed] = await Promise.all([env.QUOTES.get(key), lastQuoteChange(env)]);

  if (object === null) {
    return undefined;
  }

  const computedAt = Number(object.customMetadata?.computedAt);
  const headers = new Headers(
    JSON.parse(object.customMetadata?.headers ?? "[]") as [string, string][]
  );
  const cacheControl = headers.get("cache-control");
  const maxAge = maxAgeMs(cacheControl);
  const remaining =
    Number.isNaN(computedAt) || maxAge === null ? 0 : freshFor(computedAt, maxAge, changed, now);
  const seconds = Math.floor(remaining / 1000);

  if (cacheControl === null || seconds <= 0) {
    await object.body.cancel();
    return undefined;
  }

  headers.set("cache-control", cacheControl.replace(/max-age=\d+/, `max-age=${seconds}`));
  return new Response(object.body, { status: 200, headers });
}

/** Stores a cacheable, CORS-stripped response under `key`. */
export async function writeShared(
  env: Env,
  key: string,
  response: Response,
  now: number
): Promise<void> {
  const headers = STORED_HEADERS.flatMap(name => {
    const value = response.headers.get(name);
    return value === null ? [] : [[name, value]];
  });

  await env.QUOTES.put(key, await response.arrayBuffer(), {
    customMetadata: { computedAt: String(now), headers: JSON.stringify(headers) }
  });
}
