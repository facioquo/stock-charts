import { HttpClient, type HttpErrorResponse, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { type Observable, catchError, map, of, throwError } from "rxjs";
import { env } from "../../environments/environment";
import backupIndicators from "../data/backup-indicators.json";
import backupQuotes from "../data/backup-quotes.json";
import {
  type IndicatorListing,
  type IndicatorParam,
  type IndicatorSelection,
  type Bar
} from "@facioquo/indy-charts";

@Injectable({ providedIn: "root" })
export class ApiService {
  private readonly http = inject(HttpClient);

  /**
   * Armed when **quotes or listings** fall back to bundled backup data,
   * signalling that the overlay candlesticks are at 2016-2019 timestamps and
   * any live indicator response would diverge. While active, `getSelectionData`
   * short-circuits to backup-quote-aligned empty rows so every chart's x-axis
   * stays pinned to the candlestick range.
   *
   * Cleared only by a successful quotes/listings response — these load once at
   * bootstrap, so backup mode persists for the session unless the user reloads.
   * A transient indicator failure (e.g. one 502 on `/RSI/`) does NOT arm this
   * flag: quotes/listings are still live, candlesticks are at live timestamps,
   * and backup rows at 2016 dates would diverge from those just as badly as
   * today-dated `addExtraBars()` did. That path returns `[]` instead, letting
   * the overlay's other live datasets anchor the x-axis.
   */
  private backupActive = false;

  /** Check if the API has fallen back to bundled backup data. */
  get isBackupActive(): boolean {
    return this.backupActive;
  }

  /** Lazily-built timestamp-aligned rows for backup-mode `getSelectionData`. */
  private _backupRows: Array<{ timestamp: string; candle: unknown }> | undefined;

  getQuotes(): Observable<Bar[]> {
    type ApiQuote = {
      timestamp: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    };
    return this.http.get<ApiQuote[]>(`${env.api}/quotes`, this.requestHeader()).pipe(
      map(res => {
        // Clear backup mode only after the response has been normalized
        // successfully — a schema-error throw inside toQuotes still routes
        // to catchError and re-arms backup mode below.
        const quotes = this.toQuotes(res);
        this.backupActive = false;
        return quotes;
      }),
      catchError((error: HttpErrorResponse) => {
        this.backupActive = true;
        console.warn("Backend API unavailable, using client-side backup quotes", {
          status: error.status,
          url: error.url,
          message: error.message
        });
        return of(this.toQuotes(backupQuotes as ApiQuote[]));
      })
    );
  }

  getListings(): Observable<IndicatorListing[]> {
    return this.http.get<IndicatorListing[]>(`${env.api}/indicators`, this.requestHeader()).pipe(
      map(listings => {
        this.backupActive = false;
        return listings;
      }),
      catchError((error: HttpErrorResponse) => {
        this.backupActive = true;
        console.warn("Backend API unavailable, using client-side backup indicators", {
          status: error.status,
          url: error.url,
          message: error.message
        });
        return of(backupIndicators as IndicatorListing[]);
      })
    );
  }

  getSelectionData(
    selection: IndicatorSelection,
    listing: IndicatorListing
  ): Observable<unknown[]> {
    // When quotes or listings fell back to backup data, indicator results from
    // the live API would render with current timestamps against backup quote
    // dates — producing the visually-inconsistent overlay vs oscillator behavior
    // seen on Cloudflare Pages PR previews before the API has been redeployed.
    // Returning rows aligned to backup quote timestamps (with the candle for
    // candlestick-pattern indicators) keeps every chart's x-axis pinned to the
    // candlestick range; NaN y-values render as gaps so no spurious line is drawn.
    if (this.backupActive) {
      console.warn("Backup data active, returning timestamp-aligned empty data for indicator", {
        uiid: selection.uiid
      });
      return of(this.backupSelectionRows());
    }

    let params = new HttpParams();
    selection.params.forEach((p: IndicatorParam) => {
      params = params.set(p.paramName, String(p.value));
    });
    return this.http
      .get<unknown[]>(this.buildApiUrl(listing.endpoint), {
        ...this.requestHeader(),
        params
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (!this.isTransientBackendUnavailable(error)) {
            return throwError(() => error);
          }

          // Do NOT arm backupActive here — quotes/listings are still live, so
          // the candlesticks are at live timestamps. Returning backup rows
          // (2016-2019) would diverge from those just like the original
          // `[]` + today-dated `addExtraBars()` did. Empty array lets the
          // overlay's other live datasets keep the x-axis anchored.
          console.warn("Backend API unavailable, using empty data for indicator", {
            uiid: selection.uiid,
            status: error.status
          });
          return of([]);
        })
      );
  }

  // HELPERS

  /**
   * Build one indicator row per backup quote, carrying only the timestamp and
   * candle. `buildDataPoints` in indy-charts reads `row[result.dataName]`,
   * gets `undefined`, coerces it to NaN, and emits a gap; candlestick-pattern
   * indicators additionally read `row.candle` for high/low anchoring.
   *
   * Returns a **fresh array** wrapping a memoized payload — the row objects
   * are reused (they're effectively immutable POJOs read by indy-charts), but
   * each caller receives its own array reference so an accidental in-place
   * sort/splice downstream can't corrupt the cache for subsequent requests.
   */
  private backupSelectionRows(): Array<{ timestamp: string; candle: unknown }> {
    if (!this._backupRows) {
      type BackupQuote = {
        timestamp: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
      };
      const quotes = backupQuotes as BackupQuote[];
      this._backupRows = quotes.map(q => ({ timestamp: q.timestamp, candle: q }));
    }
    return [...this._backupRows];
  }

  requestHeader(): { headers?: HttpHeaders } {
    // GET requests carry no body, so Accept is the appropriate header (not Content-Type).
    const simpleHeaders = new HttpHeaders().set("Accept", "application/json");

    return { headers: simpleHeaders };
  }

  private buildApiUrl(endpoint: string): string {
    const baseUrl = env.api.endsWith("/") ? env.api : `${env.api}/`;
    return new URL(endpoint, baseUrl).toString();
  }

  private isTransientBackendUnavailable(error: HttpErrorResponse): boolean {
    return (
      error.status === 0 || error.status === 502 || error.status === 503 || error.status === 504
    );
  }

  private toQuotes(
    raw: Array<{
      timestamp: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>
  ): Bar[] {
    // Normalize API quote format to Bar[] ensuring timestamp is a valid Date instance.
    return raw.map((q, index) => ({
      timestamp: this.parseTimestamp(q.timestamp, index),
      open: q.open,
      high: q.high,
      low: q.low,
      close: q.close,
      volume: q.volume
    }));
  }

  private parseTimestamp(value: string, index: number): Date {
    const timestamp = new Date(value);
    if (Number.isNaN(timestamp.getTime())) {
      throw new Error(`Invalid quote timestamp at index ${index}: "${value}"`);
    }
    return timestamp;
  }
}
