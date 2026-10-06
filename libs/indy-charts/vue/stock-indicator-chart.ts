import {
  computed,
  defineComponent,
  h,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
  type PropType,
  type VNode
} from "vue";

import { createApiClient, loadStaticIndicatorData, peekCachedListings } from "../api";
import { ChartManager } from "../charts";
import type { IndicatorDataRow, IndicatorListing, IndicatorSelection } from "../config";
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
const OSCILLATOR_CHART_TYPE = "oscillator";
const DATA_UNAVAILABLE_ERROR_MESSAGE =
  "Chart data is currently unavailable. Check the API service and try again.";
const MISSING_SETUP_ERROR_MESSAGE = "setupIndyChartsForVue() has not been called.";
const LOADING_MESSAGE = "Loading chart data...";
const EMPTY_MESSAGE = "No chart data is available.";

/**
 * Positions the status message over the reserved chart frames so it never
 * takes flow space. Inline because the package ships no stylesheet and this
 * positioning is what keeps the layout stable; visual styling stays with the
 * consumer's `.indy-demo__status` rules.
 */
const STATUS_LAYER_STYLE = {
  position: "absolute",
  inset: "0",
  zIndex: "1",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px",
  boxSizing: "border-box",
  textAlign: "center"
} as const;

type PaneKind = "overlay" | "oscillator";

/** The chart frames to reserve before data has loaded. */
interface FramePlan {
  overlay: boolean;
  oscillators: number;
}

/** A single indicator resolved to a chart config, ready for data loading. */
interface ResolvedIndicator {
  config: StockIndicatorChartConfig;
  /** Original lookup name (registry key or uiid) used for diagnostics. */
  name: string;
}

/** An indicator whose selection and data are ready to hand to the ChartManager. */
interface PreparedIndicator {
  selection: IndicatorSelection;
  listing: IndicatorListing;
  chartRows: IndicatorDataRow[];
  isOscillator: boolean;
  /** Human-readable indicator name used for the canvas accessible name. */
  title: string;
}

/** Describes one oscillator canvas pane to render in the template. */
interface OscillatorPane {
  /** Stable key (the selection ucid) used for the canvas ref map and v-for key. */
  key: string;
  testId: string;
  /** Accessible name for the pane's canvas. */
  label: string;
}

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

/**
 * Normalize the `with` prop/config value to a de-duplicated list of non-empty
 * indicator names. Duplicates are dropped so the same companion is not fetched
 * and rendered twice.
 */
function normalizeWithList(value: string | string[] | undefined): string[] {
  if (value == null) return [];
  const list = Array.isArray(value) ? value : [value];
  const trimmed = list.map(name => name.trim()).filter(name => name.length > 0);
  return [...new Set(trimmed)];
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

function paneKind(listing: IndicatorListing): PaneKind {
  return listing.chartType === OSCILLATOR_CHART_TYPE ? "oscillator" : "overlay";
}

function overlayLabel(titles: string[]): string {
  return titles.length > 0 ? `${titles.join(" and ")} chart over price bars` : "Price bars chart";
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
    /**
     * Companion indicator name(s) to compose into the same chart under one
     * ChartManager. Overlay-type companions render on the shared price panel;
     * oscillator-type companions render as aligned panes beneath it.
     */
    with: {
      type: [String, Array] as PropType<string | string[]>,
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
    const overlayVisible = ref(false);
    const overlayCanvasLabel = ref(overlayLabel([]));
    const oscillatorPanes = ref<OscillatorPane[]>([]);
    /**
     * Listings known for this API, used only to size the reserved frames.
     * Unset for the first (server or hydrating) render so it matches static
     * HTML, then filled from the shared cache on mount.
     */
    const knownListings = shallowRef<IndicatorListing[] | undefined>(undefined);
    const overlayCanvas = ref<HTMLCanvasElement | null>(null);
    const oscillatorCanvases = new Map<string, HTMLCanvasElement>();
    const rootId = computed(() => {
      const normalized = slug(props.id ?? props.config.id ?? props.indicator ?? "chart");
      return normalized || "chart";
    });
    const testIdPrefix = computed(() => `${STOCK_INDICATOR_CHART_TESTID_PREFIX}-${rootId.value}`);

    let manager: ChartManager | undefined;
    let loadToken = 0;
    let disposed = false;
    let themeObserver: MutationObserver | undefined;

    function setOscillatorCanvas(key: string, el: unknown): void {
      // Vue invokes the ref callback with the element on mount and `null` on
      // unmount; mirror the overlay ref's truthiness handling (store on mount,
      // drop on unmount) so each oscillator pane's canvas stays addressable.
      if (el) {
        oscillatorCanvases.set(key, el as HTMLCanvasElement);
      } else {
        oscillatorCanvases.delete(key);
      }
    }

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

    /**
     * Resolve the primary indicator plus any `with` companions to chart configs.
     * The primary merges registry defaults with the `config` prop; companions
     * resolve from the registry (falling back to the name as a uiid).
     */
    function resolvedIndicators(): ResolvedIndicator[] {
      if (!options) {
        throw new Error(MISSING_SETUP_ERROR_MESSAGE);
      }

      const primary = resolvedConfig();
      const indicators: ResolvedIndicator[] = [
        { config: primary, name: props.indicator ?? options.defaults?.indicator ?? "chart" }
      ];

      // Track resolved uiids (case-insensitive) so a companion that duplicates
      // the primary — or another companion — is not fetched and rendered twice.
      const seenUiids = new Set<string>();
      if (primary.uiid) seenUiids.add(primary.uiid.toLowerCase());

      const companions = normalizeWithList(props.with ?? props.config.with);
      for (const name of companions) {
        const registered = registryConfig(options, name) ?? {};
        const uiid = registered.uiid ?? name;
        if (seenUiids.has(uiid.toLowerCase())) continue;
        seenUiids.add(uiid.toLowerCase());
        indicators.push({ config: { ...registered, uiid }, name });
      }

      return indicators;
    }

    /**
     * Decide which frames to reserve before data arrives, from (in order) the
     * known listings, each config's `chartType` hint, and the props: an
     * unknown primary is an oscillator when `withOverlay` is set (the prop only
     * matters for oscillators), otherwise an overlay. An unknown companion
     * reserves nothing, since its pane type cannot be inferred.
     */
    function planFrames(): FramePlan {
      let indicators: ResolvedIndicator[];
      try {
        indicators = resolvedIndicators();
      } catch {
        return { overlay: true, oscillators: 0 };
      }

      const listings = knownListings.value;
      const kinds = indicators.map((indicator, index): PaneKind | undefined => {
        const uiid = indicator.config.uiid;
        const listing = listings && uiid ? findListing(listings, uiid) : undefined;
        if (listing) return paneKind(listing);
        if (indicator.config.chartType) return indicator.config.chartType;
        if (index === 0) return props.withOverlay ? "oscillator" : "overlay";
        return undefined;
      });

      const oscillators = kinds.filter(kind => kind === "oscillator").length;
      const overlay = props.withOverlay || kinds.includes("overlay") || oscillators === 0;
      return { overlay, oscillators };
    }

    /**
     * Build a selection for one indicator, applying any requested results
     * filter and replacing label tokens. Returns the populated selection.
     */
    function buildSelection(
      config: StockIndicatorChartConfig,
      listing: IndicatorListing
    ): IndicatorSelection {
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
      return selection;
    }

    async function loadChart(): Promise<void> {
      const token = ++loadToken;
      destroyChart();
      oscillatorCanvases.clear();
      phase.value = "loading";
      errorMessage.value = DATA_UNAVAILABLE_ERROR_MESSAGE;
      errorKind.value = "data";

      try {
        if (!options) {
          throw new Error(MISSING_SETUP_ERROR_MESSAGE);
        }

        const indicators = resolvedIndicators();
        const primaryConfig = indicators[0].config;
        if (!primaryConfig.uiid) {
          throw new Error("A chart indicator or config.uiid is required.");
        }

        const client = createApiClient(options.api);
        // Publish listings as soon as they arrive so the reserved frames are
        // corrected before quotes and selection data finish loading.
        const listingsRequest = client.getListings().then(result => {
          if (!disposed && token === loadToken) knownListings.value = result;
          return result;
        });
        const [quotes, listings] = await Promise.all([client.getQuotes(), listingsRequest]);
        if (disposed || token !== loadToken) return;

        const quoteCount = normalizeWindowSize(
          primaryConfig.quoteCount ?? options.defaults?.quoteCount ?? DEFAULT_BAR_COUNT,
          quotes.length
        );
        const chartQuotes = quotes.slice(-quoteCount);
        if (chartQuotes.length === 0) {
          phase.value = "empty";
          return;
        }

        // Load every indicator's selection data concurrently. Promise.all
        // preserves order, so the primary stays first and oscillator panes keep
        // a deterministic order. A rejected fetch (e.g. an unknown listing)
        // surfaces through the outer try/catch as the error state.
        const results = await Promise.all(
          indicators.map(async (indicator): Promise<PreparedIndicator | null> => {
            const uiid = indicator.config.uiid;
            if (!uiid) {
              throw new Error("A chart indicator or config.uiid is required.");
            }

            const listing = findListing(listings, uiid);
            if (!listing) {
              throw new Error(`Indicator listing not found for uiid "${uiid}".`);
            }

            const selection = buildSelection(indicator.config, listing);
            const rows = loadStaticIndicatorData(await client.getSelectionData(selection, listing));

            const chartRows = rows.slice(-chartQuotes.length);
            if (chartRows.length === 0) {
              // A companion with no data is skipped so the rest of the chart
              // still renders; an empty primary collapses to the empty state.
              console.warn(
                `[indy-charts] No data returned for indicator "${indicator.name}" (uiid "${uiid}").`
              );
              return null;
            }

            return {
              selection,
              listing,
              chartRows,
              isOscillator: paneKind(listing) === "oscillator",
              title: indicator.config.title ?? listing.name
            };
          })
        );
        if (disposed || token !== loadToken) return;

        const prepared = results.filter((item): item is PreparedIndicator => item !== null);
        if (prepared.length === 0) {
          phase.value = "empty";
          return;
        }

        const overlays = prepared.filter(item => !item.isOscillator);
        const oscillators = prepared.filter(item => item.isOscillator);
        const needsOverlay = overlays.length > 0 || props.withOverlay === true;

        overlayVisible.value = needsOverlay;
        overlayCanvasLabel.value = overlayLabel(overlays.map(item => item.title));
        oscillatorPanes.value = oscillators.map((item, index) => ({
          key: item.selection.ucid,
          testId:
            index === 0
              ? `${testIdPrefix.value}-oscillator-canvas`
              : `${testIdPrefix.value}-oscillator-canvas-${index}`,
          label: `${item.title} chart`
        }));

        phase.value = "ready";
        await nextTick();
        if (disposed || token !== loadToken) return;

        setupIndyCharts();
        const barCount =
          props.barCount ??
          primaryConfig.barCount ??
          options.defaults?.barCount ??
          DEFAULT_BAR_COUNT;
        const normalizedBarCount = normalizeWindowSize(barCount, chartQuotes.length);
        const chartManager = new ChartManager({ settings: currentSettings() });
        manager = chartManager;

        if (needsOverlay) {
          if (!overlayCanvas.value) {
            throw new Error("Overlay chart canvas is not available.");
          }
          chartManager.initializeOverlay(overlayCanvas.value, chartQuotes, normalizedBarCount);
        }

        // Overlay-type indicators attach to the shared price panel first so the
        // windowed x-axis is established before oscillators align to it.
        for (const item of overlays) {
          chartManager.processSelectionData(item.selection, item.listing, item.chartRows);
          chartManager.displaySelection(item.selection, item.listing);
        }

        // Each oscillator renders into its own canvas, re-sliced to the same
        // windowed range as the overlay so the panes stay x-axis aligned.
        for (const item of oscillators) {
          const canvas = oscillatorCanvases.get(item.selection.ucid);
          if (!canvas) {
            throw new Error("Oscillator chart canvas is not available.");
          }
          chartManager.processSelectionData(item.selection, item.listing, item.chartRows);
          chartManager.displaySelection(item.selection, item.listing);
          chartManager.createOscillator(canvas, item.selection, item.listing);
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
      if (options) {
        knownListings.value = peekCachedListings(options.api);
      }
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
          props.with,
          props.config.uiid,
          props.config.with,
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

    function renderStatus(): VNode | null {
      const prefix = testIdPrefix.value;
      switch (phase.value) {
        case "idle":
        case "loading":
          return h(
            "div",
            {
              key: "loading",
              class: "indy-demo__status indy-demo__status--loading",
              role: "status",
              "data-testid": `${prefix}-loading`
            },
            LOADING_MESSAGE
          );
        case "empty":
          return h(
            "div",
            {
              key: "empty",
              class: "indy-demo__status indy-demo__status--error",
              role: "status",
              "data-testid": `${prefix}-empty`
            },
            EMPTY_MESSAGE
          );
        case "error":
          return h(
            "div",
            {
              // A distinct key mounts a fresh element, so the alert is inserted
              // with its message rather than patched into the loading region.
              key: "error",
              class: "indy-demo__status indy-demo__status--error",
              role: "alert",
              "data-testid": `${prefix}-error`,
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
          );
        case "ready":
          return null;
      }
    }

    /** Sized frames holding the live canvases, once data is ready. */
    function renderChartFrames(): VNode[] {
      const frames: VNode[] = [];
      if (overlayVisible.value) {
        frames.push(
          h(
            "div",
            { key: "overlay", class: "indy-demo__canvas-wrap indy-demo__canvas-wrap--overlay" },
            [
              h("canvas", {
                ref: overlayCanvas,
                class: "indy-demo__canvas",
                role: "img",
                "aria-label": overlayCanvasLabel.value,
                "data-testid": `${testIdPrefix.value}-overlay-canvas`
              })
            ]
          )
        );
      }
      for (const pane of oscillatorPanes.value) {
        frames.push(
          h(
            "div",
            {
              key: pane.key,
              class: "indy-demo__canvas-wrap indy-demo__canvas-wrap--oscillator"
            },
            [
              h("canvas", {
                ref: (el: unknown) => setOscillatorCanvas(pane.key, el),
                class: "indy-demo__canvas",
                role: "img",
                "aria-label": pane.label,
                "data-testid": pane.testId
              })
            ]
          )
        );
      }
      return frames;
    }

    /** Empty sized frames reserved before data arrives (no canvases yet). */
    function renderPlaceholderFrames(): VNode[] {
      const plan = planFrames();
      const prefix = testIdPrefix.value;
      const frames: VNode[] = [];
      if (plan.overlay) {
        frames.push(
          h("div", {
            key: "overlay",
            class:
              "indy-demo__canvas-wrap indy-demo__canvas-wrap--overlay indy-demo__canvas-wrap--placeholder",
            "aria-hidden": "true",
            "data-testid": `${prefix}-overlay-frame`
          })
        );
      }
      for (let index = 0; index < plan.oscillators; index++) {
        frames.push(
          h("div", {
            key: `oscillator-placeholder-${index}`,
            class:
              "indy-demo__canvas-wrap indy-demo__canvas-wrap--oscillator indy-demo__canvas-wrap--placeholder",
            "aria-hidden": "true",
            "data-testid": `${prefix}-oscillator-frame`
          })
        );
      }
      return frames;
    }

    // The frame stack renders on every pass — including the server and first
    // client render — so the chart's height is reserved before any data
    // arrives. Status messages overlay the frames instead of taking flow space.
    return () => {
      const status = renderStatus();
      const frames = phase.value === "ready" ? renderChartFrames() : renderPlaceholderFrames();
      return h(
        "section",
        {
          id: rootId.value,
          class: "indy-demo stock-indicator-chart",
          "data-testid": `${testIdPrefix.value}-root`
        },
        [
          h(
            "div",
            {
              class: "indy-demo__stack",
              style: { position: "relative" },
              "data-testid": `${testIdPrefix.value}-layout`
            },
            [
              ...frames,
              status
                ? h(
                    "div",
                    { key: "status", class: "indy-demo__status-layer", style: STATUS_LAYER_STYLE },
                    [status]
                  )
                : null
            ]
          )
        ]
      );
    };
  }
});
