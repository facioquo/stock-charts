import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { Observable, of, catchError } from "rxjs";
import { env } from "../../environments/environment";

import {
  IndicatorListing,
  IndicatorParam,
  IndicatorSelection,
  Quote
} from "../pages/chart/chart.models";
import { CLIENT_BACKUP_QUOTES } from "../data/backup-quotes";
import { CLIENT_BACKUP_INDICATORS } from "../data/backup-indicators";

@Injectable({
  providedIn: "root"
})
export class ApiService {
  private readonly http = inject(HttpClient);


  getQuotes(): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${env.api}/quotes`, this.requestHeader())
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.warn("Backend API unavailable, using client-side backup quotes", {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            message: error.message
          });
          
          // Return client-side backup quotes as failover
          return of(CLIENT_BACKUP_QUOTES);
        })
      );
  }

  getListings(): Observable<IndicatorListing[]> {
    return this.http.get<IndicatorListing[]>(`${env.api}/indicators`, this.requestHeader())
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.warn("Backend API unavailable, using client-side backup indicators", {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            message: error.message
          });
          
          // Return client-side backup indicators as failover
          return of(CLIENT_BACKUP_INDICATORS);
        })
      );
  }

  getSelectionData(
    selection: IndicatorSelection,
    listing: IndicatorListing): Observable<unknown> {

    const obs = new Observable((observer) => {

      // compose url
      let url = `${listing.endpoint}?`;
      selection.params.forEach((param: IndicatorParam, param_index: number) => {
        if (param_index !== 0) url += "&";
        url += `${param.paramName}=${param.value}`;
      });

      // fetch data
      this.http.get(url, this.requestHeader())
        .subscribe({

          next: (data: unknown[]) => {
            observer.next(data);
          },

          error: (e: HttpErrorResponse) => {
            console.log("DATA", e);
            observer.error(e);
          }
        });
    });

    return obs;
  }

  // HELPERS
  requestHeader(): { headers?: HttpHeaders } {

    const simpleHeaders = new HttpHeaders()
      .set("Content-Type", "application/json");

    return { headers: simpleHeaders };
  }
}
