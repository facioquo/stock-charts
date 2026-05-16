<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

import { OverlayChart, loadStaticQuotes } from "@facioquo/indy-charts";

import { SAMPLE_QUOTES } from "./sample-quotes";

const quotes = loadStaticQuotes(SAMPLE_QUOTES);

const canvasEl = ref<HTMLCanvasElement | null>(null);
let overlayChart: OverlayChart | null = null;
let observer: MutationObserver | null = null;

function isDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

function renderChart(): void {
  if (!canvasEl.value) return;
  overlayChart?.chart?.destroy();
  overlayChart = new OverlayChart(canvasEl.value, {
    isDarkTheme: isDark(),
    showTooltips: true
  });
  overlayChart.render(quotes);
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
  overlayChart?.chart?.destroy();
  overlayChart = null;
});
</script>

<template>
  <div style="height: 400px; position: relative">
    <canvas ref="canvasEl" />
  </div>
</template>
