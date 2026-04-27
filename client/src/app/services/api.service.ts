import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, catchError, map, of } from "rxjs";
import { env } from "../../environments/environment";
import backupIndicators from "../data/backup-indicators.json";
import backupQuotes from "../data/backup-quotes.json";
import {
  IndicatorListing,
  IndicatorParam,
  IndicatorSelection,
  Quote,
  RawQuote
} from "@facioquo/indy-charts";

@Injectable({ providedIn: "root" })
export class ApiService {
  private readonly http = inject(HttpClient);

  getQuotes(): Observable<Quote[]> {
    return this.http.get<RawQuote[]>(`${env.api}/quotes`, this.requestHeader()).pipe(
      map(res => this.toQuotes(res)),
      catchError((error: HttpErrorResponse) => {
        console.warn("Backend API unavailable, using client-side backup quotes", {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message
        });
        return of(this.toQuotes(backupQuotes as RawQuote[]));
      })
    );
  }

  getListings(): Observable<IndicatorListing[]> {
    return this.http.get<IndicatorListing[]>(`${env.api}/indicators`, this.requestHeader()).pipe(
      catchError((error: HttpErrorResponse) => {
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

  private toQuotes(raw: RawQuote[]): Quote[] {
    // Normalize RawQuote[] to Quote[] ensuring date field is a Date instance.
    return raw.map(q => ({
      date: new Date(q.date),
      open: q.open,
      high: q.high,
      low: q.low,
      close: q.close,
      volume: q.volume
    }));
  }
}
