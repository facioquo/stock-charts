import {
  applySelectionTokens,
  ChartManager,
  createDefaultSelection,
  type ChartSettings,
  type IndicatorDataRow,
  type IndicatorListing,
  type IndicatorSelection
} from "@facioquo/indy-charts";

import { apiClient, type ApiClient } from "../api/apiClient";
import { env } from "../config/env";
import { getSettings } from "../services/userPrefs";
import { scrollToEnd, scrollToStart } from "../services/meta";
import { calculateOptimalBars, subscribeResize } from "../services/windowSize";
import { buildShareUrl, decodeSelections, SHARE_PARAM } from "./shareLink";

/** A restore fetch slower than this is skipped, so it cannot hold back saving user changes. */
const RESTORE_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out after ${ms} ms`));
    }, ms);
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    );
  });
}

export interface ChartState {
  loading: boolean;
  apiError: boolean;
  /** Showing a share link's indicators, not yet the user's saved ones. */
  sharedView: boolean;
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
  /** True while startup selections are being restored, so a partial list is never saved. */
  private restoring = false;
  private loadInFlight: Promise<void> | undefined;
  /** A user change landed while restoring, so the post-restore save is owed. */
  private changedWhileRestoring = false;
  /** The page was opened from a share link whose selections are not saved yet. */
  private linkActive = false;
  /** Set once the visitor leaves a share link, so a restore still in flight cannot save the link's list. */
  private leavingLink = false;
  /** Restore fetches that failed or timed out. Saves keep them for this session so a transient failure does not delete a saved indicator, though they are not shown. */
  private unrestored: IndicatorSelection[] = [];
  /** Saved order of the last restore, so kept selections return to their slot. */
  private restoreOrder: string[] = [];

  /** Indicator catalog loaded from the API. */
  listings: IndicatorListing[] = [];

  private state: ChartState = { loading: true, apiError: false, sharedView: false };
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
    this.showSelection(selection, listing, data as IndicatorDataRow[], scrollToMe);
    this.cacheSelections();
  }

  /**
   * Replace a displayed indicator with an edited copy, keeping its `ucid` and
   * its place in the stack. The new data is fetched before the old selection is
   * touched, so a failed fetch leaves the chart unchanged. A failure while
   * drawing the replacement removes the indicator; saving again adds it back.
   */
  async updateSelection(
    ucid: string,
    edited: IndicatorSelection,
    listing: IndicatorListing
  ): Promise<void> {
    // Labels were resolved from the old parameter values; restore the listing's
    // templates so applySelectionTokens fills in the edited ones.
    const replacement: IndicatorSelection = {
      ...edited,
      ucid,
      label: listing.legendTemplate,
      results: edited.results.map(result => ({
        ...result,
        label:
          listing.results?.find(config => config.dataName === result.dataName)?.tooltipTemplate ??
          result.label
      }))
    };
    // Not displayed: an earlier save failed after removing it. Add it back.
    if (!this.selections.some(s => s.ucid === ucid)) {
      await this.addSelection(replacement, listing);
      return;
    }

    const data = await this.api.getSelectionData(replacement, listing);

    const order = this.selections.map(s => s.ucid);
    const before = document.getElementById(`${ucid}-container`)?.nextSibling ?? null;
    this.removeDisplayed(ucid);
    this.showSelection(replacement, listing, data as IndicatorDataRow[], false, before);
    // Display appends; restore the original position (and overlay layering).
    this.chartManager.reorderSelections(order);
    this.cacheSelections();
  }

  /**
   * Show startup selections in list order. Fetches run concurrently, and each
   * chart is built as soon as it and every chart before it has settled, so
   * arrival order cannot change the stack and one slow request holds back only
   * the charts after it. A selection that fails to load is not shown, but stays saved for this session.
   */
  private async showSelectionsInOrder(selections: readonly IndicatorSelection[]): Promise<void> {
    this.restoring = true;
    this.changedWhileRestoring = false;
    this.restoreOrder = selections.map(selection => selection.ucid);
    try {
      const pending = selections.map(async selection => {
        const listing = this.listings.find(x => x.uiid === selection.uiid);
        if (!listing) return undefined;
        try {
          const rows = (await withTimeout(
            this.api.getSelectionData(selection, listing),
            RESTORE_TIMEOUT_MS
          )) as IndicatorDataRow[];
          return { selection, listing, rows };
        } catch (error) {
          this.unrestored.push(selection);
          console.error("Error adding selection without scroll:", error);
          return undefined;
        }
      });

      for (const request of pending) {
        const item = await request;
        if (!item) continue;
        try {
          this.showSelection(item.selection, item.listing, item.rows, false);
        } catch (error) {
          this.unrestored.push(item.selection);
          console.error("Error adding selection without scroll:", error);
        }
      }
    } finally {
      this.restoring = false;
    }
    this.placeAddedDuringRestoreLast(selections);
    // Never overwrite the saved list when nothing could be restored, and keep a
    // shared link unsaved until the user changes something.
    if (
      (!this.linkActive || this.userChangedWhileRestoring()) &&
      (this.selections.length > 0 || this.unrestored.length > 0)
    ) {
      this.cacheSelections();
    }
  }

  /** Read through a method: the flag is set by other calls while the restore awaits. */
  private userChangedWhileRestoring(): boolean {
    return this.changedWhileRestoring;
  }

  /** An indicator added while restoring displays first; saved order puts it after the restored ones. */
  private placeAddedDuringRestoreLast(restored: readonly IndicatorSelection[]): void {
    const restoredIds = new Set(restored.map(selection => selection.ucid));
    const added = this.selections.filter(selection => !restoredIds.has(selection.ucid));
    if (added.length === 0) return;
    const order = [
      ...this.selections.filter(selection => restoredIds.has(selection.ucid)),
      ...added
    ].map(selection => selection.ucid);
    this.chartManager.reorderSelections(order);
    this.syncOscillatorDom();
  }

  /**
   * Move a displayed indicator one place up or down within its own group:
   * overlays change layering, oscillators change chart order. A move at the end
   * of the group does nothing.
   */
  moveSelection(ucid: string, offset: -1 | 1): void {
    const moved = this.selections.find(s => s.ucid === ucid);
    if (!moved) return;

    const group = this.selections.filter(s => s.chartType === moved.chartType);
    const from = group.indexOf(moved);
    const to = from + offset;
    if (to < 0 || to >= group.length) return;

    // Move within the group, leaving the other group's slots where they are.
    const reordered = group.filter(s => s !== moved);
    reordered.splice(to, 0, moved);
    let next = 0;
    const order = this.selections.map(s =>
      s.chartType === moved.chartType ? (reordered.at(next++)?.ucid ?? s.ucid) : s.ucid
    );
    this.chartManager.reorderSelections(order);

    if (moved.chartType === "oscillator") this.syncOscillatorDom();
    this.cacheSelections();
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
    if (!this.removeDisplayed(ucid)) return;

    // Removing every displayed indicator also clears what could not be restored.
    if (!this.restoring && this.selections.length === 0) this.unrestored = [];
    this.cacheSelections();
  }

  /** Removes the chart and its DOM container without touching the saved list. */
  private removeDisplayed(ucid: string): boolean {
    const selection = this.selections.find(s => s.ucid === ucid);
    if (!selection) return false;

    this.chartManager.removeSelection(ucid);
    if (selection.chartType === "oscillator") {
      const container = document.getElementById(`${ucid}-container`);
      container?.parentNode?.removeChild(container);
    }
    return true;
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

  /**
   * Bootstrap the overlay chart and load cached / default indicators. A call
   * made while another is running joins it, so a development remount (React
   * strict mode runs effects twice) cannot restore every indicator twice.
   */
  loadCharts(): Promise<void> {
    this.loadInFlight ??= this.bootstrapCharts().finally(() => {
      this.loadInFlight = undefined;
    });
    return this.loadInFlight;
  }

  private async bootstrapCharts(): Promise<void> {
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

  private showSelection(
    selection: IndicatorSelection,
    listing: IndicatorListing,
    rows: IndicatorDataRow[],
    scrollToMe: boolean,
    before: Node | null = null
  ): void {
    this.chartManager.processSelectionData(selection, listing, rows);
    applySelectionTokens(selection);
    this.chartManager.displaySelection(selection, listing);

    if (listing.chartType === "oscillator") {
      this.createOscillatorDom(selection, listing, scrollToMe, before);
    } else if (scrollToMe) {
      scrollToStart("chart-overlay");
    }
  }

  private createOscillatorDom(
    selection: IndicatorSelection,
    listing: IndicatorListing,
    scrollToMe: boolean,
    before: Node | null = null
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
    body.insertBefore(container, before);

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

  /** Re-append the oscillator canvases in model order. */
  private syncOscillatorDom(): void {
    const zone = document.getElementById("oscillators-zone");
    if (!zone) return;
    for (const selection of this.selections) {
      if (selection.chartType !== "oscillator") continue;
      const container = document.getElementById(`${selection.ucid}-container`);
      if (container) zone.appendChild(container);
    }
  }

  private cacheSelections(): void {
    if (this.leavingLink) return;
    if (this.restoring) {
      this.changedWhileRestoring = true;
      return;
    }
    if (this.linkActive) this.dropShareParam();
    this.persistSelections(this.selections);
  }

  /** Inserts each unrestored selection after its nearest saved predecessor that is present. */
  private withUnrestored(list: readonly IndicatorSelection[]): IndicatorSelection[] {
    const out = [...list];
    for (const item of this.unrestored) {
      if (out.some(x => x.ucid === item.ucid)) continue;
      let at = 0;
      for (let i = this.restoreOrder.indexOf(item.ucid) - 1; i >= 0; i--) {
        const found = out.findIndex(x => x.ucid === this.restoreOrder.at(i));
        if (found >= 0) {
          at = found + 1;
          break;
        }
      }
      out.splice(at, 0, item);
    }
    return out;
  }

  private persistSelections(list: readonly IndicatorSelection[]): void {
    const ordered = this.withUnrestored(list);
    try {
      const selections = ordered.map(selection => ({
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

  /** The link's selections replace saved ones only once the user changes something. */
  private loadSharedSelections(): boolean {
    const encoded = new URLSearchParams(window.location.search).get(SHARE_PARAM);
    if (!encoded) return false;
    const shared = decodeSelections(encoded, this.listings);
    if (shared.length === 0) {
      console.warn("Ignoring an unreadable share link");
      this.dropShareParam();
      return false;
    }
    this.linkActive = true;
    this.setState({ sharedView: true });
    void this.showSelectionsInOrder(shared).then(() => {
      // A link whose indicators all fail to load must not leave an empty chart.
      if (!this.linkActive || this.selections.length > 0) return;
      this.dropShareParam();
      this.unrestored = [];
      this.loadSavedSelections();
    });
    return true;
  }

  private dropShareParam(): void {
    this.linkActive = false;
    this.setState({ sharedView: false });
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete(SHARE_PARAM);
      window.history.replaceState(window.history.state, "", url);
    } catch {
      // History may be unavailable.
    }
  }

  /** Leaves a share link's view for the saved setup, which the link never replaced. */
  returnToSavedSetup(): void {
    if (!this.linkActive) return;
    this.leavingLink = true;
    this.dropShareParam();
    window.location.reload();
  }

  /** A link that restores the current selections on any browser. */
  shareUrl(): string {
    return buildShareUrl(this.selections, this.listings);
  }

  private loadSelections(): void {
    if (this.loadSharedSelections()) return;
    this.loadSavedSelections();
  }

  private loadSavedSelections(): void {
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
        void this.showSelectionsInOrder(cached);
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

    const selections = defaults.flatMap(({ uiid, lookbackPeriods }) => {
      const selection = this.tryDefaultSelection(uiid);
      if (!selection) return [];

      const lookbackParam = selection.params.find(x => x.paramName === "lookbackPeriods");
      if (lookbackParam && lookbackPeriods !== undefined) {
        lookbackParam.value = lookbackPeriods;
      }
      return [selection];
    });

    void this.showSelectionsInOrder(selections);
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
