import { type Quote, type IndicatorDataRow } from "../config/types";

/**
 * Raw input shape accepted by {@link loadStaticQuotes}. Timestamps may be
 * either ISO 8601 strings or `Date` instances; everything else is OHLCV
 * numbers. Use this when typing static fixture arrays for bring-your-own-data
 * pages so the fixture type and the loader signature stay in lockstep.
 */
export interface RawQuote {
  timestamp: string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Load static quote data synchronously (for VitePress SSG or build-time rendering).
 * Accepts objects with ISO 8601 string or Date timestamps and normalizes them to Date objects.
 */
export function loadStaticQuotes(raw: RawQuote[]): Quote[] {
  return raw.map((q, index) => ({
    timestamp: normalizeTimestamp(q.timestamp, index),
    open: q.open,
    high: q.high,
    low: q.low,
    close: q.close,
    volume: q.volume
  }));
}

function normalizeTimestamp(value: string | Date, index: number): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error(`Invalid timestamp at index ${index}: "${value.toString()}"`);
    }
    return value;
  }
  return parseTimestamp(value, index);
}

function parseTimestamp(value: string, index: number): Date {
  const date = new Date(value.trim());
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp at index ${index}: "${value}"`);
  }
  return date;
}

/**
 * Load static indicator data synchronously (for VitePress SSG or build-time rendering).
 * Passes through data as-is since indicator results are already in the correct format.
 */
export function loadStaticIndicatorData(data: unknown[]): IndicatorDataRow[] {
  return data as IndicatorDataRow[];
}
