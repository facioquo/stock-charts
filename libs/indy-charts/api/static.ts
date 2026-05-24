import { type Quote, type IndicatorDataRow } from "../config/types";

/**
 * Load static quote data synchronously (for VitePress SSG or build-time
 * rendering). Accepts `Quote[]` with either ISO string or `Date` timestamps
 * (per the `Quote.timestamp: Date | string` contract) and returns a new
 * array with timestamps normalized to `Date` instances.
 */
export function loadStaticQuotes(raw: Quote[]): Quote[] {
  return raw.map((q, index) => ({
    timestamp: normalizeTimestamp(q.timestamp, index),
    open: q.open,
    high: q.high,
    low: q.low,
    close: q.close,
    volume: q.volume
  }));
}

function normalizeTimestamp(value: Date | string, index: number): Date {
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
 * Load static indicator data synchronously (for VitePress SSG or build-time
 * rendering). Pass-through helper — `IndicatorDataRow[]` rows are already in
 * the shape downstream transformers expect.
 */
export function loadStaticIndicatorData(data: IndicatorDataRow[]): IndicatorDataRow[] {
  return data;
}
