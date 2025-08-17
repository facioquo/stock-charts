import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, catchError, of } from "rxjs";
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
    return this.http.get<Quote[]>(`${env.api}/quotes`, this.requestHeader()).pipe(
      catchError((error: HttpErrorResponse) => {
        console.warn("Backend API unavailable, using client-side backup quotes", {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message
        });
        const mapped = (backupQuotes as RawQuote[]).map(q => ({
          date: new Date(q.date),
          open: q.open,
          high: q.high,
          low: q.low,
          close: q.close,
          volume: q.volume
        }));
        return of(mapped as Quote[]);
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
}
