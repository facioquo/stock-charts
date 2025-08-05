import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs/internal/Observable";
import { env } from "../../environments/environment";

import {
  IndicatorListing,
  IndicatorParam,
  IndicatorSelection
} from '../pages/chart/chart.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);


  getQuotes() {
    return this.http.get(`${env.api}/quotes`, this.requestHeader());
  }

  getListings() {
    return this.http.get(`${env.api}/indicators`, this.requestHeader());
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
      .set('Content-Type', 'application/json');

    return { headers: simpleHeaders };
  }
}
