<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useData } from "vitepress";

import {
  createApiClient,
  type ChartSettings,
  OverlayChart,
  setupIndyCharts
} from "@facioquo/indy-charts";

interface Props {
  apiBaseUrl?: string;
  barCount?: number;
  showTooltips?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  apiBaseUrl: "https://localhost:5001",
  barCount: 250,
  showTooltips: true
});

const canvasRef = ref<HTMLCanvasElement | null>(null);
const phase = ref<"idle" | "loading" | "ready" | "error">("idle");
const errorMessage = ref("");

const { isDark } = useData();

let chart: OverlayChart | null = null;
let disposed = false;
let loadToken = 0;

function currentSettings(): ChartSettings {
  return {
    isDarkTheme: isDark.value,
    showTooltips: props.showTooltips
  };
}

function destroyChart(): void {
  chart?.destroy();
  chart = null;
}

async function loadDemo(): Promise<void> {
  const token = ++loadToken;
  destroyChart();

  phase.value = "loading";
  errorMessage.value = "";

  const client = createApiClient({
    baseUrl: props.apiBaseUrl,
    onError: () => {
      // Let the component catch and present a single user-facing message.
    }
  });

  try {
    setupIndyCharts();
    const quotes = await client.getQuotes();

    if (disposed || token !== loadToken) return;

    phase.value = "ready";
    await nextTick();

    if (disposed || token !== loadToken) return;
    if (!canvasRef.value) {
      throw new Error("Demo canvas is not available.");
    }

    chart = new OverlayChart(canvasRef.value, currentSettings());
    chart.render(quotes.slice(-props.barCount));
  } catch {
    if (disposed || token !== loadToken) return;

    phase.value = "error";
    errorMessage.value =
      "Unable to load quote data from the Web API. Start the full stack demo task (Azure Storage, Functions, Web API, and VitePress).";
  }
}

watch(isDark, () => {
  chart?.updateTheme(currentSettings());
});

onMounted(() => {
  void loadDemo();
});

onUnmounted(() => {
  disposed = true;
  destroyChart();
});
</script>

<template>
  <section class="indy-demo" data-testid="indy-overlay-demo">
    <div class="indy-demo__header">
      <div>
        <p class="indy-demo__title">Live Overlay Chart Demo</p>
        <p class="indy-demo__hint">
          Candlestick + volume rendered by <code>OverlayChart</code>
        </p>
      </div>
    </div>

    <div
      v-if="phase === 'loading'"
      class="indy-demo__status indy-demo__status--loading"
      data-testid="indy-overlay-demo-loading"
      aria-live="polite"
    >
      Loading quotes and rendering chart...
    </div>

    <div
      v-else-if="phase === 'error'"
      class="indy-demo__status indy-demo__status--error"
      data-testid="indy-overlay-demo-error"
      role="alert"
    >
      {{ errorMessage }}
      <div class="indy-demo__status-actions">
        <button type="button" class="indy-demo__retry" @click="void loadDemo()">
          Retry
        </button>
      </div>
    </div>

    <div class="indy-demo__panel">
      <p class="indy-demo__panel-title">Price + Volume</p>
      <div class="indy-demo__canvas-wrap indy-demo__canvas-wrap--overlay">
        <canvas
          ref="canvasRef"
          class="indy-demo__canvas"
          data-testid="indy-overlay-demo-canvas"
        ></canvas>
      </div>
    </div>
  </section>
</template>
