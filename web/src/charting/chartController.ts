import {
  applySelectionTokens,
  ChartManager,
  createDefaultSelection,
  type ChartSettings,
  type IndicatorDataRow,
  type IndicatorListing,
  type IndicatorSelection
} from "@facioquo/indy-charts";

import { apiClient, ApiClient } from "../api/apiClient";
import { env } from "../config/env";
import { getSettings } from "../services/userPrefs";
import { scrollToEnd, scrollToStart } from "../services/meta";
import { calculateOptimalBars, subscribeResize } from "../services/windowSize";

export interface ChartState {
  loading: boolean;
  apiError: boolean;
}

/**
 * Framework-neutral port of the Angular `ChartService`. Orchestrates the chart
 * lifecycle by delegating rendering/dataset/theming to {@link ChartManager},
 * and retains the app-specific concerns: backup-aware API calls, localStorage
 * caching, oscillator DOM container management, scrolling, and default-selection
 * hydration.
 *
 * Exposes a tiny observable store (`subscribe`/`getState`) so React can bind to
 * `loading` / `apiError` via `useSyncExternalStore` — replacing Angular signals.
 */
export class ChartController {
  private readonly chartManager: ChartManager;
  private readonly api: ApiClient;
  private unsubscribeResize: (() => void) | undefined;

  /** Indicator catalog loaded from the API. */
  listings: IndicatorListing[] = [];

  private state: ChartState = { loading: true, apiError: false };
  private readonly listeners = new Set<() => void>();

  constructor(api: ApiClient = apiClient) {
    this.api = api;
    this.chartManager = new ChartManager({ settings: this.chartSettings });
    this.unsubscribeResize = subscribeResize(dimensions => this.onWindowResize(dimensions));
  }

  private get chartSettings(): ChartSettings {
    const settings = getSettings();
    return { isDarkTheme: settings.isDarkTheme, showTooltips: settings.showTooltips };
  }

  /** Read-only proxy to ChartManager selections (used by the settings UI). */
  get selections(): readonly IndicatorSelection[] {
    return this.chartManager.selections;
  }

  // STORE

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = (): ChartState => this.state;

  private setState(patch: Partial<ChartState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach(l => l());
  }

  destroy(): void {
    this.unsubscribeResize?.();
    this.unsubscribeResize = undefined;
    this.chartManager.destroy();
  }

  //#region SELECT / DISPLAY OPERATIONS

  /** Fetch indicator data, process via ChartManager, and display it. */
  async addSelection(
    selection: IndicatorSelection,
    listing: IndicatorListing,
    scrollToMe = false
  ): Promise<void> {
    const data = await this.api.getSelectionData(selection, listing);
    const rows = data as IndicatorDataRow[];
    this.chartManager.processSelectionData(selection, listing, rows);
    applySelectionTokens(selection);
    this.chartManager.displaySelection(selection, listing);

    if (listing.chartType === "oscillator") {
      this.createOscillatorDom(selection, listing, scrollToMe);
    } else if (scrollToMe) {
      scrollToStart("chart-overlay");
    }

    this.cacheSelections();
  }

  /** Add an indicator without scrolling; swallows errors (used during startup). */
  addSelectionWithoutScroll(selection: IndicatorSelection): void {
    const listing = this.listings.find(x => x.uiid === selection.uiid);
    if (!listing) return;
    void this.addSelection(selection, listing, false).catch((error: unknown) => {
      console.error("Error adding selection without scroll:", error);
    });
  }

  /** Create a default selection from the indicator catalog. */
  defaultSelection(uiid: string): IndicatorSelection {
    const listing = this.listings.find(x => x.uiid === uiid);
    if (!listing) {
      throw new Error(`Indicator listing not found for uiid: ${uiid}`);
    }
    return createDefaultSelection(listing);
  }

  /** Remove an indicator and clean up its chart / DOM container. */
  deleteSelection(ucid: string): void {
    const selection = this.selections.find(s => s.ucid === ucid);
    if (!selection) return;

    const isOscillator = selection.chartType === "oscillator";
    this.chartManager.removeSelection(ucid);

    if (isOscillator) {
      const container = document.getElementById(`${ucid}-container`);
      container?.parentNode?.removeChild(container);
    }

    this.cacheSelections();
  }

  /** Propagate theme / tooltip changes to all charts. */
  onSettingsChange(): void {
    this.chartManager.updateTheme(this.chartSettings);
  }

  //#endregion

  //#region WINDOW OPERATIONS

  onWindowResize(dimensions: { width: number; height: number }): void {
    const newBarCount = calculateOptimalBars(dimensions.width);
    this.chartManager.setBarCount(newBarCount);
    this.chartManager.resize();
  }

  //#endregion

  //#region DATA OPERATIONS

  /** Bootstrap the overlay chart and load cached / default indicators. */
  async loadCharts(): Promise<void> {
    try {
      const allQuotes = await this.api.getQuotes();

      if (env.production && this.api.isBackupActive) {
        console.error("Backend API is unavailable in production");
        this.setState({ apiError: true, loading: false });
        return;
      }

      const canvas = document.getElementById("chartOverlay") as HTMLCanvasElement | null;
      const ctx = canvas?.getContext("2d");
      if (!ctx) {
        console.error("Cannot acquire chart overlay canvas context");
        this.setState({ loading: false });
        return;
      }

      const barCount = calculateOptimalBars();
      console.log(`Loading charts with ${barCount} bars`);
      this.chartManager.initializeOverlay(ctx, allQuotes, barCount);

      try {
        const listings = await this.api.getListings();
        if (env.production && this.api.isBackupActive) {
          console.error("Backend API is unavailable in production");
          this.setState({ apiError: true, loading: false });
          return;
        }
        this.listings = listings;
        this.loadSelections();
      } catch (error) {
        this.logError("Error loading listings", error);
      } finally {
        this.setState({ loading: false });
      }
    } catch (error) {
      this.logError("Error getting quotes", error);
      this.setState({ loading: false });
    }
  }

  //#endregion

  //#region PRIVATE HELPERS

  private createOscillatorDom(
    selection: IndicatorSelection,
    listing: IndicatorListing,
    scrollToMe: boolean
  ): void {
    const body = document.getElementById("oscillators-zone");
    if (!body) return;

    const containerId = `${selection.ucid}-container`;
    const existing = document.getElementById(containerId);
    if (existing) body.removeChild(existing);

    const container = document.createElement("div");
    container.id = containerId;
    container.className = "chart-oscillator-container";

    const canvas = document.createElement("canvas");
    canvas.id = selection.ucid;
    container.appendChild(canvas);
    body.appendChild(container);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      body.removeChild(container);
      return;
    }

    try {
      this.chartManager.createOscillator(ctx, selection, listing);
    } catch (error) {
      body.removeChild(container);
      throw error;
    }

    if (scrollToMe) scrollToEnd(container.id);
  }

  private cacheSelections(): void {
    try {
      const selections = this.selections.map(selection => ({
        ...selection,
        params: selection.params.map(param => ({ ...param })),
        results: selection.results.map(result => ({
          label: result.label,
          displayName: result.displayName,
          dataName: result.dataName,
          color: result.color,
          lineType: result.lineType,
          lineWidth: result.lineWidth,
          order: result.order,
          dataset: { type: "line" as const, data: [] }
        }))
      }));
      localStorage.setItem("selections", JSON.stringify(selections));
    } catch {
      // localStorage may be unavailable.
    }
  }

  private loadSelections(): void {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem("selections");
    } catch {
      // fall through to defaults
    }

    if (!raw) {
      this.loadDefaultSelections();
      return;
    }

    try {
      const cached = JSON.parse(raw) as IndicatorSelection[] | null;
      // Respect explicitly-stored empty arrays (user removed all indicators).
      if (Array.isArray(cached)) {
        cached.forEach(selection => this.addSelectionWithoutScroll(selection));
        return;
      }
    } catch {
      // Corrupted JSON — fall through to defaults
    }

    this.loadDefaultSelections();
  }

  private loadDefaultSelections(): void {
    const defaults: Array<{ uiid: string; lookbackPeriods?: number }> = [
      { uiid: "LINEAR", lookbackPeriods: 50 },
      { uiid: "BB" },
      { uiid: "RSI", lookbackPeriods: 5 },
      { uiid: "ADX" },
      { uiid: "SUPERTREND" },
      { uiid: "MACD" },
      { uiid: "MARUBOZU" }
    ];

    defaults.forEach(({ uiid, lookbackPeriods }) => {
      const selection = this.tryDefaultSelection(uiid);
      if (!selection) return;

      const lookbackParam = selection.params.find(x => x.paramName === "lookbackPeriods");
      if (lookbackParam && lookbackPeriods !== undefined) {
        lookbackParam.value = lookbackPeriods;
      }

      this.addSelectionWithoutScroll(selection);
    });
  }

  private tryDefaultSelection(uiid: string): IndicatorSelection | undefined {
    const listing = this.listings.find(x => x.uiid === uiid);
    if (!listing) {
      console.warn(`Skipping default indicator because listing was not found: ${uiid}`);
      return undefined;
    }
    return createDefaultSelection(listing);
  }

  private logError(context: string, error: unknown): void {
    console.error(context, error instanceof Error ? { message: error.message } : { error });
  }

  //#endregion
}
