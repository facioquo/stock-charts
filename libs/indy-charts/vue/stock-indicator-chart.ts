import {
  computed,
  defineComponent,
  h,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
  type PropType
} from "vue";

import { createApiClient, loadStaticIndicatorData } from "../api";
import { ChartManager } from "../charts";
import type { IndicatorListing } from "../config";
import { applySelectionTokens, createDefaultSelection } from "../helpers";
import { setupIndyCharts } from "../setup";
import { indyChartsVueOptionsKey } from "./context";
import { slug, STOCK_INDICATOR_CHART_TESTID_PREFIX } from "./slug";
import {
  chartSettingsFromOptions,
  type IndyChartsVueOptions,
  type StockIndicatorChartConfig,
  type StockIndicatorChartPhase
} from "./types";

const DEFAULT_BAR_COUNT = 250;
const DATA_UNAVAILABLE_ERROR_MESSAGE =
  "Chart data is currently unavailable. Check the API service and try again.";
const MISSING_SETUP_ERROR_MESSAGE = "setupIndyChartsForVue() has not been called.";

function findListing(listings: IndicatorListing[], uiid: string): IndicatorListing | undefined {
  return listings.find(listing => listing.uiid.toLowerCase() === uiid.toLowerCase());
}

function registryConfig(
  options: IndyChartsVueOptions,
  indicator: string | undefined
): StockIndicatorChartConfig | undefined {
  const registry = options.indicators ?? {};
  return indicator ? registry[indicator] : undefined;
}

function isAuthorFacingError(error: unknown): error is Error {
  if (!(error instanceof Error)) return false;

  return (
    error.message === MISSING_SETUP_ERROR_MESSAGE ||
    error.message === "A chart indicator or config.uiid is required." ||
    error.message.startsWith("Indicator listing not found for uiid") ||
    error.message.endsWith("chart canvas is not available.")
  );
}

function normalizeWindowSize(value: number, total: number): number {
  if (total <= 0) return 0;

  const normalized = Number.isFinite(value) ? Math.floor(value) : 1;
  return Math.max(1, Math.min(normalized, total));
}

export const StockIndicatorChart = defineComponent({
  name: "StockIndicatorChart",
  props: {
    indicator: {
      type: String,
      required: false
    },
    id: {
      type: String,
      required: false
    },
    config: {
      type: Object as PropType<StockIndicatorChartConfig>,
      required: false,
      default: (): StockIndicatorChartConfig => ({})
    },
    barCount: {
      type: Number,
      required: false
    },
    withOverlay: {
      type: Boolean,
      required: false
    },
    background: {
      type: String,
      required: false
    }
  },
  setup(props) {
    const options = inject<IndyChartsVueOptions>(indyChartsVueOptionsKey);
    const phase = ref<StockIndicatorChartPhase>("idle");
    const errorMessage = ref(DATA_UNAVAILABLE_ERROR_MESSAGE);
    const errorKind = ref<"author" | "data">("data");
    const chartType = ref<string>("overlay");
    const overlayCanvas = ref<HTMLCanvasElement | null>(null);
    const oscillatorCanvas = ref<HTMLCanvasElement | null>(null);
    const rootId = computed(() =>
      slug(props.id ?? props.config.id ?? props.indicator ?? "chart")
    );
    const testIdPrefix = computed(() => `${STOCK_INDICATOR_CHART_TESTID_PREFIX}-${rootId.value}`);
    const showOverlayCanvas = computed(
      () => chartType.value !== "oscillator" || props.withOverlay === true
    );

    let manager: ChartManager | undefined;
    let loadToken = 0;
    let disposed = false;
    let themeObserver: MutationObserver | undefined;

    function destroyChart(): void {
      manager?.destroy();
      manager = undefined;
    }

    function shouldObserveDarkMode(): boolean {
      return options?.theme?.observeVitePressDarkMode ?? true;
    }

    function isDarkTheme(): boolean {
      if (typeof document !== "undefined" && shouldObserveDarkMode()) {
        return document.documentElement.classList.contains("dark");
      }
      return options?.theme?.isDarkTheme ?? false;
    }

    function currentSettings() {
      if (!options) {
        return { isDarkTheme: false, showTooltips: true };
      }

      const background = props.background ?? props.config.background;
      return chartSettingsFromOptions(options, isDarkTheme(), background);
    }

    function resolvedConfig(): StockIndicatorChartConfig {
      if (!options) {
        throw new Error(MISSING_SETUP_ERROR_MESSAGE);
      }

      const indicator = props.indicator ?? options.defaults?.indicator;
      const registered = registryConfig(options, indicator) ?? {};
      const config = props.config ?? {};
      return {
        ...registered,
        ...config,
        uiid: config.uiid ?? registered.uiid ?? indicator
      };
    }

    async function loadChart(): Promise<void> {
      const token = ++loadToken;
      destroyChart();
      phase.value = "loading";
      errorMessage.value = DATA_UNAVAILABLE_ERROR_MESSAGE;
      errorKind.value = "data";

      try {
        if (!options) {
          throw new Error(MISSING_SETUP_ERROR_MESSAGE);
        }

        const config = resolvedConfig();
        if (!config.uiid) {
          throw new Error("A chart indicator or config.uiid is required.");
        }

        const client = createApiClient(options.api);
        const [quotes, listings] = await Promise.all([client.getQuotes(), client.getListings()]);
        if (disposed || token !== loadToken) return;

        const listing = findListing(listings, config.uiid);
        if (!listing) {
          throw new Error(`Indicator listing not found for uiid "${config.uiid}".`);
        }

        const quoteCount = normalizeWindowSize(
          config.quoteCount ?? options.defaults?.quoteCount ?? DEFAULT_BAR_COUNT,
          quotes.length
        );
        const chartQuotes = quotes.slice(-quoteCount);
        if (chartQuotes.length === 0) {
          phase.value = "empty";
          return;
        }

        const selection = createDefaultSelection(listing, config.params, `${rootId.value}-`);
        if (config.results?.length) {
          const wanted = new Set(config.results.map(result => result.toLowerCase()));
          const filtered = selection.results.filter(result =>
            wanted.has(result.dataName.toLowerCase())
          );
          if (filtered.length === 0) {
            console.warn(
              `[indy-charts] None of the requested results [${config.results.join(", ")}] ` +
                `match available result names for uiid "${config.uiid}". ` +
                `Available: [${selection.results.map(r => r.dataName).join(", ")}].`
            );
          }
          selection.results = filtered;
        }
        applySelectionTokens(selection);

        const rows = loadStaticIndicatorData(await client.getSelectionData(selection, listing));
        const chartRows = rows.slice(-chartQuotes.length);
        if (disposed || token !== loadToken) return;

        if (chartRows.length === 0) {
          phase.value = "empty";
          return;
        }

        chartType.value = listing.chartType;
        phase.value = "ready";
        await nextTick();

        if (disposed || token !== loadToken) return;
        const isOscillator = listing.chartType === "oscillator";
        const needsOverlay = !isOscillator || props.withOverlay === true;

        setupIndyCharts();
        const barCount =
          props.barCount ?? config.barCount ?? options.defaults?.barCount ?? DEFAULT_BAR_COUNT;
        const normalizedBarCount = normalizeWindowSize(barCount, chartQuotes.length);
        const chartManager = new ChartManager({ settings: currentSettings() });
        manager = chartManager;

        if (needsOverlay) {
          if (!overlayCanvas.value) {
            throw new Error("Overlay chart canvas is not available.");
          }
          chartManager.initializeOverlay(overlayCanvas.value, chartQuotes, normalizedBarCount);
        }

        chartManager.processSelectionData(selection, listing, chartRows);
        chartManager.displaySelection(selection, listing);

        if (isOscillator) {
          if (!oscillatorCanvas.value) {
            throw new Error("Oscillator chart canvas is not available.");
          }
          chartManager.createOscillator(oscillatorCanvas.value, selection, listing);
        }
      } catch (error) {
        if (disposed || token !== loadToken) return;
        destroyChart();
        phase.value = "error";
        const authorFacing = isAuthorFacingError(error);
        errorMessage.value = authorFacing ? error.message : DATA_UNAVAILABLE_ERROR_MESSAGE;
        errorKind.value = authorFacing ? "author" : "data";
      }
    }

    function updateTheme(): void {
      manager?.updateTheme(currentSettings());
    }

    onMounted(() => {
      if (
        typeof document !== "undefined" &&
        typeof MutationObserver !== "undefined" &&
        shouldObserveDarkMode()
      ) {
        themeObserver = new MutationObserver(updateTheme);
        themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["class"]
        });
      }
      void loadChart();
    });

    onUnmounted(() => {
      disposed = true;
      loadToken += 1;
      themeObserver?.disconnect();
      destroyChart();
    });

    watch(
      () =>
        [
          props.indicator,
          props.barCount,
          props.withOverlay,
          props.config.uiid,
          props.config.barCount,
          props.config.quoteCount,
          props.config.params,
          props.config.results
        ] as const,
      () => {
        if (!disposed && phase.value !== "idle") {
          void loadChart();
        }
      },
      { deep: true }
    );

    watch(
      () => [props.background, props.config.background] as const,
      () => {
        updateTheme();
      }
    );

    return () =>
      h(
        "section",
        { class: "indy-demo stock-indicator-chart", "data-testid": `${testIdPrefix.value}-root` },
        [
          phase.value === "loading"
            ? [
                h(
                  "div",
                  {
                    class: "indy-demo__status indy-demo__status--loading",
                    "data-testid": `${testIdPrefix.value}-loading`
                  },
                  "Loading chart data..."
                ),
                h(
                  "div",
                  {
                    class: "indy-demo__stack indy-demo__stack--loading",
                    "data-testid": `${testIdPrefix.value}-loading-layout`
                  },
                  [
                    h("div", {
                      class:
                        "indy-demo__canvas-wrap indy-demo__canvas-wrap--overlay indy-demo__canvas-wrap--placeholder"
                    })
                  ]
                )
              ]
            : null,
          phase.value === "empty"
            ? h(
                "div",
                {
                  class: "indy-demo__status indy-demo__status--error",
                  "data-testid": `${testIdPrefix.value}-empty`
                },
                "No chart data is available."
              )
            : null,
          phase.value === "error"
            ? h(
                "div",
                {
                  class: "indy-demo__status indy-demo__status--error",
                  "data-testid": `${testIdPrefix.value}-error`,
                  "data-error-kind": errorKind.value
                },
                [
                  h("span", errorMessage.value),
                  h("div", { class: "indy-demo__status-actions" }, [
                    h(
                      "button",
                      {
                        type: "button",
                        class: "indy-demo__retry",
                        onClick: () => void loadChart()
                      },
                      "Retry"
                    )
                  ])
                ]
              )
            : null,
          phase.value === "ready"
            ? h("div", { class: "indy-demo__stack" }, [
                showOverlayCanvas.value
                  ? h("div", { class: "indy-demo__canvas-wrap indy-demo__canvas-wrap--overlay" }, [
                      h("canvas", {
                        ref: overlayCanvas,
                        class: "indy-demo__canvas",
                        "data-testid": `${testIdPrefix.value}-overlay-canvas`
                      })
                    ])
                  : null,
                chartType.value === "oscillator"
                  ? h(
                      "div",
                      { class: "indy-demo__canvas-wrap indy-demo__canvas-wrap--oscillator" },
                      [
                        h("canvas", {
                          ref: oscillatorCanvas,
                          class: "indy-demo__canvas",
                          "data-testid": `${testIdPrefix.value}-oscillator-canvas`
                        })
                      ]
                    )
                  : null
              ])
            : null
        ]
      );
  }
});
