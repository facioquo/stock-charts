import { HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable, OnDestroy, signal } from "@angular/core";
import { catchError, map, Observable, Subject, takeUntil } from "rxjs";

import {
  applySelectionTokens,
  ChartManager,
  createDefaultSelection,
  type ChartSettings,
  type IndicatorDataRow,
  type IndicatorListing,
  type IndicatorSelection,
  type Quote
} from "@facioquo/indy-charts";

import { ApiService } from "./api.service";
import { UserService } from "./user.service";
import { UtilityService } from "./utility.service";
import { WindowService } from "./window.service";

/**
 * Angular service that orchestrates chart lifecycle by delegating
 * rendering, dataset management, and theming to {@link ChartManager}.
 *
 * Retains Angular-specific concerns: DI wiring, RxJS-based API calls,
 * localStorage caching, oscillator DOM container management, scrolling,
 * and default-selection hydration.
 */
@Injectable({
  providedIn: "root"
})
export class ChartService implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly usr = inject(UserService);
  private readonly util = inject(UtilityService);
  private readonly window = inject(WindowService);
  private readonly destroy$ = new Subject<void>();
  private readonly chartManager: ChartManager;

  /** Current chart settings derived from user preferences. */
  private get chartSettings(): ChartSettings {
    return {
      isDarkTheme: this.usr.settings.isDarkTheme,
      showTooltips: this.usr.settings.showTooltips
    };
  }

  /** Indicator catalog loaded from the API. */
  listings: IndicatorListing[] = [];

  /** Whether the initial chart load is in progress. */
  loading = signal(true);

  /** Read-only proxy to ChartManager selections (used by templates). */
  get selections(): readonly IndicatorSelection[] {
    return this.chartManager.selections;
  }

  constructor() {
    this.chartManager = new ChartManager({ settings: this.chartSettings });

    this.window
      .getResizeObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(dimensions => this.onWindowResize(dimensions));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chartManager.destroy();
  }

  //#region SELECT / DISPLAY OPERATIONS

  /**
   * Fetch indicator data from the API, process it via ChartManager,
   * and display the result on the appropriate chart.
   */
  addSelection(
    selection: IndicatorSelection,
    listing: IndicatorListing,
    scrollToMe: boolean = false
  ): Observable<void> {
    return this.api.getSelectionData(selection, listing).pipe(
      map(data => {
        const rows = data as IndicatorDataRow[];
        this.chartManager.processSelectionData(selection, listing, rows);
        applySelectionTokens(selection);
        this.chartManager.displaySelection(selection, listing);

        if (listing.chartType === "oscillator") {
          this.createOscillatorDom(selection, listing, scrollToMe);
        } else if (scrollToMe) {
          this.util.scrollToStart("chart-overlay");
        }

        this.cacheSelections();
      }),
      catchError((error: HttpErrorResponse) => {
        this.logHttpError("Chart Service Error", error);
        throw error;
      })
    );
  }

  /** Convenience wrapper: add an indicator without scrolling. */
  addSelectionWithoutScroll(selection: IndicatorSelection): void {
    const listing = this.listings.find(x => x.uiid === selection.uiid);
    if (!listing) return;
    this.addSelection(selection, listing, false).subscribe({
      error: (error: unknown) => {
        // Log error to console but don't re-throw to prevent unhandled exception during startup
        console.error("Error adding selection without scroll:", error);
      }
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

    // ChartManager destroys the Chart.js instance and removes datasets.
    this.chartManager.removeSelection(ucid);

    // Remove the oscillator DOM container (ChartManager does not manage DOM).
    if (isOscillator) {
      const container = document.getElementById(`${ucid}-container`);
      if (container?.parentNode) {
        container.parentNode.removeChild(container);
      }
    }

    this.cacheSelections();
  }

  /** Propagate theme / tooltip changes to all charts. */
  onSettingsChange(): void {
    this.chartManager.updateTheme(this.chartSettings);
  }

  //#endregion

  //#region WINDOW OPERATIONS

  /** Handle browser resize: re-slice datasets and resize chart canvases. */
  onWindowResize(dimensions: { width: number; height: number }): void {
    const newBarCount = this.window.calculateOptimalBars(dimensions.width);
    this.chartManager.setBarCount(newBarCount);
    this.chartManager.resize();
  }

  //#endregion

  //#region DATA OPERATIONS

  /** Bootstrap the overlay chart and load cached / default indicators. */
  loadCharts(): void {
    this.api.getQuotes().subscribe({
      next: (allQuotes: Quote[]) => {
        const canvas = document.getElementById("chartOverlay") as HTMLCanvasElement;
        const ctx = canvas?.getContext("2d");
        if (!ctx) {
          console.error("Cannot acquire chart overlay canvas context");
          this.loading.set(false);
          return;
        }

        const barCount = this.window.calculateOptimalBars();
        console.log(`Loading charts with ${barCount} bars`);
        this.chartManager.initializeOverlay(ctx, allQuotes, barCount);

        this.api.getListings().subscribe({
          next: (listings: IndicatorListing[]) => {
            this.listings = listings;
            this.loadSelections();
          },
          error: (e: HttpErrorResponse) => {
            this.logHttpError("Error loading listings", e);
            this.loading.set(false);
          },
          complete: () => {
            this.loading.set(false);
          }
        });
      },
      error: (e: HttpErrorResponse) => {
        this.logHttpError("Error getting quotes", e);
        this.loading.set(false);
      }
    });
  }

  //#endregion

  //#region PRIVATE HELPERS

  /** Create DOM container + canvas for an oscillator and delegate chart creation. */
  private createOscillatorDom(
    selection: IndicatorSelection,
    listing: IndicatorListing,
    scrollToMe: boolean
  ): void {
    const body = document.getElementById("oscillators-zone");
    if (!body) return;

    const containerId = `${selection.ucid}-container`;

    // Pre-delete if the container already exists (theme-change rebuild path).
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
    if (!ctx) return;

    this.chartManager.createOscillator(ctx, selection, listing);

    if (scrollToMe) this.util.scrollToEnd(container.id);
  }

  /** Persist current selections to localStorage (without chart references). */
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
      // localStorage may be unavailable (private browsing, quota exceeded, etc.)
    }
  }

  /** Load cached selections or fall back to defaults. */
  private loadSelections(): void {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem("selections");
    } catch {
      // localStorage unavailable — fall through to defaults
    }

    if (!raw) {
      this.loadDefaultSelections();
      return;
    }

    try {
      const cached = JSON.parse(raw) as IndicatorSelection[] | null;
      if (cached?.length) {
        cached.forEach(selection => this.addSelectionWithoutScroll(selection));
        return;
      }
    } catch {
      // Corrupted JSON — fall through to defaults
    }

    this.loadDefaultSelections();
  }

  /** Hydrate a set of sensible default indicators for first-time visitors. */
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

  /** Format and log an HTTP error. */
  private logHttpError(context: string, error: HttpErrorResponse): void {
    console.error(context, {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      message: error.message
    });
  }

  //#endregion
}
