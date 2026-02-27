<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useData } from "vitepress";

import {
  ChartManager,
  createApiClient,
  type ChartSettings,
  type IndicatorListing,
  loadStaticIndicatorData,
  setupIndyCharts
} from "@facioquo/indy-charts";

import {
  applySelectionTokens,
  createDefaultSelection,
  requireListing,
  setSelectionParams
} from "./indy-demo-utils";

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

const overlayCanvasRef = ref<HTMLCanvasElement | null>(null);
const rsiCanvasRef = ref<HTMLCanvasElement | null>(null);
const macdCanvasRef = ref<HTMLCanvasElement | null>(null);

const phase = ref<"idle" | "loading" | "ready" | "error">("idle");
const errorMessage = ref("");

const { isDark } = useData();

let manager: ChartManager | null = null;
let disposed = false;
let loadToken = 0;

function currentSettings(): ChartSettings {
  return {
    isDarkTheme: isDark.value,
    showTooltips: props.showTooltips
  };
}

function destroyManager(): void {
  manager?.destroy();
  manager = null;
}

async function addIndicator(
  client: ReturnType<typeof createApiClient>,
  listings: IndicatorListing[],
  uiid: string,
  paramOverrides: Record<string, number>,
  oscillatorCanvas: HTMLCanvasElement | null | undefined,
  managerRef: ChartManager,
  token: number
): Promise<void> {
  const listing = requireListing(listings, uiid);
  const selection = applySelectionTokens(
    setSelectionParams(createDefaultSelection(listing), paramOverrides)
  );

  const raw = await client.getSelectionData(selection, listing);
  if (disposed || token !== loadToken || manager !== managerRef) return;
  const rows = loadStaticIndicatorData(raw);

  managerRef.processSelectionData(selection, listing, rows);
  managerRef.displaySelection(selection, listing);

  if (listing.chartType === "oscillator") {
    if (!oscillatorCanvas) {
      throw new Error(`Oscillator canvas is required for indicator "${uiid}".`);
    }

    managerRef.createOscillator(oscillatorCanvas, selection, listing);
  }
}

async function loadDemo(): Promise<void> {
  const token = ++loadToken;
  destroyManager();

  phase.value = "loading";
  errorMessage.value = "";

  try {
    setupIndyCharts();

    const client = createApiClient({
      baseUrl: props.apiBaseUrl,
      onError: () => {
        // Caller handles the user-facing message below.
      }
    });

    const [quotes, listings] = await Promise.all([client.getQuotes(), client.getListings()]);

    if (disposed || token !== loadToken) return;

    phase.value = "ready";
    await nextTick();

    if (!overlayCanvasRef.value || !rsiCanvasRef.value || !macdCanvasRef.value) {
      throw new Error("One or more chart canvases are missing.");
    }

    const chartManager = new ChartManager({ settings: currentSettings() });
    manager = chartManager;
    chartManager.initializeOverlay(overlayCanvasRef.value, quotes, props.barCount);

    await addIndicator(client, listings, "EMA", { lookbackPeriods: 20 }, undefined, chartManager, token);
    await addIndicator(client, listings, "RSI", { lookbackPeriods: 14 }, rsiCanvasRef.value, chartManager, token);
    await addIndicator(client, listings, "MACD", {}, macdCanvasRef.value, chartManager, token);
  } catch (error) {
    if (disposed || token !== loadToken) return;

    phase.value = "error";
    const detail = error instanceof Error ? ` (${error.message})` : "";
    errorMessage.value =
      "Unable to load indicator data from the Web API. Start the full stack demo task before using the indicators page." +
      detail;
  }
}

watch(isDark, () => {
  manager?.updateTheme(currentSettings());
});

onMounted(() => {
  void loadDemo();
});

onUnmounted(() => {
  disposed = true;
  destroyManager();
});
</script>

<template>
  <section class="indy-demo" data-testid="indy-indicators-demo">
    <div class="indy-demo__header">
      <div>
        <p class="indy-demo__title">Live Indicators Demo</p>
        <p class="indy-demo__hint">
          <code>ChartManager</code> overlay + oscillator charts (EMA, RSI, MACD)
        </p>
      </div>
    </div>

    <div
      v-if="phase === 'loading'"
      class="indy-demo__status indy-demo__status--loading"
      data-testid="indy-indicators-demo-loading"
      aria-live="polite"
    >
      Loading quotes, indicator listings, and indicator series...
    </div>

    <div
      v-else-if="phase === 'error'"
      class="indy-demo__status indy-demo__status--error"
      data-testid="indy-indicators-demo-error"
      role="alert"
    >
      {{ errorMessage }}
      <div class="indy-demo__status-actions">
        <button type="button" class="indy-demo__retry" @click="void loadDemo()">
          Retry
        </button>
      </div>
    </div>

    <div v-show="phase === 'ready'" class="indy-demo__stack">
      <div class="indy-demo__panel">
        <p class="indy-demo__panel-title">Overlay Chart (EMA 20)</p>
        <div class="indy-demo__canvas-wrap indy-demo__canvas-wrap--overlay">
          <canvas
            ref="overlayCanvasRef"
            class="indy-demo__canvas"
            data-testid="indy-indicators-demo-overlay-canvas"
          ></canvas>
        </div>
      </div>

      <div class="indy-demo__osc-grid">
        <div class="indy-demo__panel">
          <p class="indy-demo__panel-title">RSI (14)</p>
          <div class="indy-demo__canvas-wrap indy-demo__canvas-wrap--oscillator">
            <canvas
              ref="rsiCanvasRef"
              class="indy-demo__canvas"
              data-testid="indy-indicators-demo-rsi-canvas"
            ></canvas>
          </div>
        </div>

        <div class="indy-demo__panel">
          <p class="indy-demo__panel-title">MACD</p>
          <div class="indy-demo__canvas-wrap indy-demo__canvas-wrap--oscillator">
            <canvas
              ref="macdCanvasRef"
              class="indy-demo__canvas"
              data-testid="indy-indicators-demo-macd-canvas"
            ></canvas>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
