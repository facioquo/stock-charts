import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, of, catchError } from "rxjs";
import { env } from "../../environments/environment";

import { IndicatorListing, IndicatorParam, IndicatorSelection, Quote } from "../pages/chart/chart.models";
import { CLIENT_BACKUP_QUOTES } from "../data/backup-quotes";
import { CLIENT_BACKUP_INDICATORS } from "../data/backup-indicators";

@Injectable({
  providedIn: "root"
})
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
        return of(CLIENT_BACKUP_QUOTES);
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
        return of(CLIENT_BACKUP_INDICATORS);
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
