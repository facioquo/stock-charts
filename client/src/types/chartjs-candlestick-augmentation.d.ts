/**
 * Minimal candlestick chart type augmentation for Chart.js used in tests/config.
 * Provides enough typing so assigning type: "candlestick" compiles.
 * Extend with full plugin types if adopting official financial chart plugin.
 */
// (Intentionally no Chart.js imports required for lightweight augmentation helper)

export interface CandlestickDataPoint {
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  x?: number | string | Date; // optional time value
}

// We can't safely change the existing 'candlestick' property shape if already declared.
// Provide a helper mapped type consumers can use for stronger typing when needed.
export type CandlestickRegistryEntry = {
  defaultDataPoint: CandlestickDataPoint;
  parsedDataType: CandlestickDataPoint;
};

export { }; // module augmentation boundary

