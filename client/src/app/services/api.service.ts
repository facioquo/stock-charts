import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, catchError, map, of, throwError } from "rxjs";
import { env } from "../../environments/environment";
import backupIndicators from "../data/backup-indicators.json";
import backupQuotes from "../data/backup-quotes.json";
import { IndicatorListing, IndicatorParam, IndicatorSelection, Quote } from "@facioquo/indy-charts";

@Injectable({ providedIn: "root" })
export class ApiService {
  private readonly http = inject(HttpClient);

  /**
   * Set to `true` once a quotes-or-listings fetch falls back to bundled backup
   * data. While active, `getSelectionData` short-circuits to `[]` so oscillator
   * and overlay indicators do not render their live timestamps against stale
   * (or absent) backup quotes — keeping fallback behavior consistent across
   * chart types. Reset to `false` whenever a live quotes or listings response
   * succeeds so the app recovers automatically once the backend returns.
   */
  private backupActive = false;

  getQuotes(): Observable<Quote[]> {
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
          statusText: error.statusText,
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
          statusText: error.statusText,
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
    if (this.backupActive) {
      console.warn("Backup data active, returning empty data for indicator", {
        uiid: selection.uiid
      });
      return of([]);
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

          this.backupActive = true;
          console.warn("Backend API unavailable, using empty data for indicator", {
            uiid: selection.uiid,
            status: error.status,
            statusText: error.statusText
          });
          return of([]);
        })
      );
  }

  // HELPERS
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
  ): Quote[] {
    // Normalize API quote format to Quote[] ensuring timestamp is a valid Date instance.
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
