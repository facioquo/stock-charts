import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { env } from "../../environments/environment";

import { IndicatorListing, IndicatorParam, IndicatorSelection } from "../pages/chart/chart.models";

@Injectable({
  providedIn: "root"
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
