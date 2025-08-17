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
} from "../pages/chart/chart.models";

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
    return this.http.get<unknown[]>(listing.endpoint, { ...this.requestHeader(), params });
  }

  // HELPERS
  requestHeader(): { headers?: HttpHeaders } {
    const simpleHeaders = new HttpHeaders().set("Content-Type", "application/json");

    return { headers: simpleHeaders };
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
