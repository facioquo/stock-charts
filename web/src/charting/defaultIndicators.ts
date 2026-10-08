/**
 * Indicators a visitor with no saved setup sees. The offline snapshot holds a file for each at
 * these parameters; `scripts/generate-offline-snapshot.mjs` lists the same overrides.
 */
export const DEFAULT_INDICATORS: ReadonlyArray<{ uiid: string; lookbackPeriods?: number }> = [
  { uiid: "LINEAR", lookbackPeriods: 50 },
  { uiid: "BB" },
  { uiid: "RSI", lookbackPeriods: 5 },
  { uiid: "ADX" },
  { uiid: "SUPERTREND" },
  { uiid: "MACD" },
  { uiid: "MARUBOZU" }
];
