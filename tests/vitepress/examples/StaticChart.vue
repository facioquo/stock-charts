<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

import {
  OverlayChart,
  loadStaticQuotes,
  setupIndyCharts,
  type Quote
} from "@facioquo/indy-charts";

import type { ChartDataset, ScatterDataPoint } from "chart.js";

import { SAMPLE_QUOTES } from "./sample-quotes";

const quotes = loadStaticQuotes(SAMPLE_QUOTES);

const canvasEl = ref<HTMLCanvasElement | null>(null);
let overlayChart: OverlayChart | null = null;
let observer: MutationObserver | null = null;

function isDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

function computeEma(closes: number[], period: number): number[] {
  if (!Number.isInteger(period) || period <= 0) {
    throw new Error(`EMA period must be a positive integer, got ${period}`);
  }
  const k = 2 / (period + 1);
  const result: number[] = new Array(closes.length).fill(NaN);
  if (closes.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) sum += closes[i];
  result[period - 1] = sum / period;

  for (let i = period; i < closes.length; i++) {
    result[i] = closes[i] * k + result[i - 1] * (1 - k);
  }
  return result;
}

function buildEmaDataset(quotes: Quote[], period: number): ChartDataset<"line", ScatterDataPoint[]> {
  const closes = quotes.map(q => q.close);
  const ema = computeEma(closes, period);

  const data: ScatterDataPoint[] = quotes.map((q, i) => ({
    x: new Date(q.timestamp).valueOf(),
    y: ema[i]
  }));

  return {
    type: "line",
    label: `EMA(${period})`,
    data,
    yAxisID: "y",
    borderColor: "#FFA726",
    backgroundColor: "#FFA726",
    borderWidth: 1.5,
    pointRadius: 0,
    fill: false,
    spanGaps: false,
    order: 0
  };
}

function renderChart(): void {
  if (!canvasEl.value) return;
  setupIndyCharts();
  overlayChart?.destroy();
  overlayChart = new OverlayChart(canvasEl.value, {
    isDarkTheme: isDark(),
    showTooltips: false,
    showRightAxisLabels: false, // Cleaner look for documentation examples
    background: isDark() ? "#1b1b1f80" : "#ffffff80"
  });
  overlayChart.render(quotes);

  // Add an EMA(20) overlay on top of the candlestick + volume chart.
  overlayChart.chart?.data.datasets.push(buildEmaDataset(quotes, 20));
  overlayChart.chart?.update("none");
}

onMounted(() => {
  renderChart();
  observer = new MutationObserver(() => renderChart());
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"]
  });
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
  overlayChart?.destroy();
  overlayChart = null;
});
</script>

<template>
  <div style="height: 400px; position: relative">
    <canvas ref="canvasEl" />
  </div>
</template>
