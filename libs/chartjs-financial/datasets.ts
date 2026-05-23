import { ChartDataset, ScatterDataPoint } from "chart.js";

import { FinancialDataPoint, FinancialPalette } from "./types/financial.types";
import { getVolumeColor } from "./theme/colors";

interface QuoteLike {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function toFinancialDataPoint(quote: QuoteLike): FinancialDataPoint {
  return {
    x: new Date(quote.timestamp).valueOf(),
    o: quote.open,
    h: quote.high,
    l: quote.low,
    c: quote.close
  };
}

/** Builds a typed candlestick dataset from normalized OHLC points. */
export function buildCandlestickDataset(
  priceData: FinancialDataPoint[],
  borderColor: FinancialPalette["candleBorder"]
): ChartDataset<"candlestick", FinancialDataPoint[]> {
  return {
    type: "candlestick",
    label: "Price",
    data: priceData,
    yAxisID: "y",
    borderColor: borderColor as unknown as string,
    order: 75
  };
}

/** Builds a typed volume dataset with up/down/unchanged candle coloring. */
export function buildVolumeDataset(
  quotes: QuoteLike[],
  extraBars: number,
  palette: FinancialPalette
): ChartDataset<"bar", ScatterDataPoint[]> {
  const volumeData: ScatterDataPoint[] = [];
  const volumeColors: string[] = [];

  quotes.forEach(quote => {
    volumeData.push({ x: new Date(quote.timestamp).valueOf(), y: quote.volume });
    volumeColors.push(getVolumeColor(quote.open, quote.close, palette));
  });

  const maxTimeSource = volumeData.map(point => {
    const dateTime = point.x != null ? new Date(point.x).getTime() : 0;
    return Number.isFinite(dateTime) ? dateTime : 0;
  });

  const maxTimeCandidate =
    maxTimeSource.length > 0 ? Math.max(...maxTimeSource) : new Date().getTime();
  const maxTime = Number.isFinite(maxTimeCandidate) ? maxTimeCandidate : new Date().getTime();

  const nextDate = new Date(maxTime);
  for (let i = 0; i < extraBars; i++) {
    // Advance to the next business day, skipping Saturday (6) and Sunday (0),
    // so trailing volume padding aligns with the indicator/oscillator padding
    // produced by indy-charts addExtraBars (which also skips weekends).
    // UTC methods keep the padded dates deterministic across client timezones
    // — local-time arithmetic would shift the cadence near midnight UTC.
    do {
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    } while (nextDate.getUTCDay() === 0 || nextDate.getUTCDay() === 6);
    volumeData.push({ x: new Date(nextDate).valueOf(), y: Number.NaN });
    volumeColors.push(palette.volume.unchanged);
  }

  return {
    type: "bar",
    label: "Volume",
    data: volumeData,
    yAxisID: "volumeAxis",
    backgroundColor: volumeColors,
    borderWidth: 0,
    order: 76
  };
}
