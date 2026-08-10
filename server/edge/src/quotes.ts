/**
 * Scheduled quote refresh — the replacement for the Azure Functions timer
 * trigger that previously wrote daily bars to Blob Storage.
 *
 * Runs entirely in the Workers runtime and never touches the API container, so
 * refreshing quotes does not wake (or bill) it.
 */

import type { Env } from "./env";

const ALPACA_BARS_URL = "https://data.alpaca.markets/v2/stocks/bars";

/** Alpaca is queried up to this recently; the free feed lags real time. */
const FEED_DELAY_MINUTES = 16;

/** Defensive bound on pagination; ~800 daily bars fit in a single page. */
const MAX_PAGES = 10;

/** A single daily bar as returned by Alpaca. */
interface AlpacaBar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface AlpacaBarsResponse {
  bars?: Record<string, AlpacaBar[]>;
  next_page_token?: string | null;
}

/**
 * The stored dataset shape.
 *
 * PascalCase is load-bearing: the API deserializes with default
 * `JsonSerializerOptions`, which is case-sensitive, so camelCase keys would
 * parse into default-valued bars rather than failing loudly. The shared fixture
 * `server/quote-dataset.contract.json` pins this on both sides.
 */
export interface StoredBar {
  Timestamp: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
}

export function toStoredBars(bars: AlpacaBar[]): StoredBar[] {
  return bars
    .map(bar => ({
      Timestamp: bar.t,
      Open: bar.o,
      High: bar.h,
      Low: bar.l,
      Close: bar.c,
      Volume: bar.v
    }))
    .sort((a, b) => a.Timestamp.localeCompare(b.Timestamp));
}

/** Object name a symbol's dataset is stored under. */
export function datasetKey(symbol: string): string {
  return `${symbol}-DAILY.json`;
}

async function fetchBars(
  env: Env,
  symbols: string[],
  from: Date,
  into: Date
): Promise<Record<string, AlpacaBar[]>> {
  const collected: Record<string, AlpacaBar[]> = {};
  let pageToken: string | null | undefined;
  let page = 0;

  do {
    const url = new URL(ALPACA_BARS_URL);
    url.searchParams.set("symbols", symbols.join(","));
    url.searchParams.set("timeframe", "1Day");
    url.searchParams.set("start", from.toISOString());
    url.searchParams.set("end", into.toISOString());
    url.searchParams.set("limit", "10000");
    url.searchParams.set("feed", env.ALPACA_FEED ?? "iex");

    if (pageToken != null) {
      url.searchParams.set("page_token", pageToken);
    }

    const response = await fetch(url, {
      headers: {
        "APCA-API-KEY-ID": env.ALPACA_KEY ?? "",
        "APCA-API-SECRET-KEY": env.ALPACA_SECRET ?? "",
        accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Alpaca responded ${response.status}: ${await response.text()}`);
    }

    const payload = (await response.json()) as AlpacaBarsResponse;

    for (const [symbol, bars] of Object.entries(payload.bars ?? {})) {
      collected[symbol] = [...(collected[symbol] ?? []), ...bars];
    }

    pageToken = payload.next_page_token;
    page += 1;
  } while (pageToken != null && pageToken !== "" && page < MAX_PAGES);

  // Reaching the bound means the dataset would be written truncated, silently
  // shortening chart history. ~800 daily bars fit in one page, so this should
  // never fire — say so loudly if it does rather than publish partial data.
  if (pageToken != null && pageToken !== "") {
    throw new Error(
      `Alpaca pagination exceeded ${MAX_PAGES} pages; refusing to publish a truncated dataset`
    );
  }

  return collected;
}

/**
 * Refreshes every configured symbol's dataset in R2.
 *
 * Missing credentials are not an error: the API falls back to its bundled
 * backup dataset, which is what keeps the demo working for contributors who
 * have not configured Alpaca. This mirrors the previous Functions behaviour.
 */
export async function refreshQuotes(env: Env): Promise<void> {
  if (!env.ALPACA_KEY || !env.ALPACA_SECRET) {
    console.warn(
      "Alpaca credentials not configured. Quote refresh skipped - the API will serve backup data."
    );
    return;
  }

  const symbols = env.QUOTE_SYMBOLS.split(",")
    .map(symbol => symbol.trim().toUpperCase())
    .filter(symbol => symbol.length > 0);

  const historyDays = Number.parseInt(env.QUOTE_HISTORY_DAYS, 10) || 800;
  const into = new Date(Date.now() - FEED_DELAY_MINUTES * 60_000);
  const from = new Date(into.getTime() - historyDays * 24 * 60 * 60_000);

  const barsBySymbol = await fetchBars(env, symbols, from, into);

  const results = await Promise.allSettled(
    symbols.map(async symbol => {
      const bars = barsBySymbol[symbol];

      if (bars === undefined || bars.length === 0) {
        console.warn(`Skipping ${symbol}: Alpaca returned no bars`);
        return;
      }

      const key = datasetKey(symbol);
      await env.QUOTES.put(key, JSON.stringify(toStoredBars(bars)), {
        httpMetadata: { contentType: "application/json" }
      });
      console.log(`Updated dataset: ${key} (${bars.length} bars)`);
    })
  );

  // One symbol's R2 write failing must not prevent the others from being
  // published. Every rejection is logged individually before the failure is
  // reported to the caller, so a failed cron invocation still reflects that
  // at least one symbol did not update.
  const failedSymbols: string[] = [];

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      failedSymbols.push(symbols[index]);
      console.error(`Failed to update dataset for ${symbols[index]}:`, result.reason);
    }
  });

  if (failedSymbols.length > 0) {
    throw new Error(`Failed to refresh dataset(s) for: ${failedSymbols.join(", ")}`);
  }
}
