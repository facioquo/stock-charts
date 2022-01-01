import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { env } from '../../environments/environment';

import { IndicatorListing } from './api.models';
import { IndicatorParam, IndicatorResult, IndicatorSelection } from './chart.models';

@Injectable()
export class ApiService {

  constructor(
    private readonly http: HttpClient
  ) { }

  getQuotes() {
    return this.http.get(`${env.api}/quotes`, this.requestHeader());
  }

  getListings() {
    return this.http.get(`${env.api}/indicators`, this.requestHeader());
  }

  getSelectionData(selection: IndicatorSelection, listing: IndicatorListing): Observable<any> {

    const obs = new Observable((observer) => {

      // compose url
      let url = `${listing.endpoint}?`;
      selection.params.forEach((param: IndicatorParam, param_index: number) => {
        if (param_index != 0) url += "&";
        url += `${param.name}=${param.value}`;
      });

      // fetch data
      this.http.get(url, this.requestHeader())
        .subscribe({

          next: (apidata: any[]) => {

            // parse each dataset
            selection.results
              .forEach((result: IndicatorResult) => {

                // initialize dataset
                result.data = [];

                // populate data
                apidata.forEach(dt => {

                  result.data
                    .push({
                      x: new Date(dt.date).valueOf(),
                      y: dt[result.dataName]
                    });
                });
              });

            observer.next(selection.results);
          },

          error: (e: HttpErrorResponse) => { console.log(e); return null; }
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
