import type { ApiContainer } from "./container";

/** Bindings, vars, and secrets declared in wrangler.jsonc. */
export interface Env {
  /** Durable Object namespace backing the .NET indicator API container. */
  API: DurableObjectNamespace<ApiContainer>;

  /** Quote datasets written by the scheduled refresh. */
  QUOTES: R2Bucket;

  /** Per-IP rate limiter guarding the cache-miss (container-waking) path. */
  RATE_LIMITER: RateLimit;

  /** Comma-separated CORS allow list. Entries may use a `*.` subdomain wildcard. */
  ALLOWED_ORIGINS: string;

  /** Comma-separated symbols to refresh, e.g. "SPY,QQQ". */
  QUOTE_SYMBOLS: string;

  /** Days of daily-bar history to request from Alpaca. */
  QUOTE_HISTORY_DAYS: string;

  /** Alpaca market data feed. Free and paper keys are limited to "iex". */
  ALPACA_FEED?: string;

  /**
   * Public origin the API is served at. Forwarded to the container so the
   * indicator catalog emits reachable absolute URLs — the container itself only
   * ever sees its own internal address.
   */
  PUBLIC_BASE_URL?: string;

  /** Alpaca credentials, set with `wrangler secret put`. Absent is tolerated. */
  ALPACA_KEY?: string;
  ALPACA_SECRET?: string;
}
