import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { env } from '../../environments/environment';

import {
  ChartDataset,
  ScatterDataPoint
} from 'chart.js';

import {
  IndicatorListing,
  IndicatorParam,
  IndicatorResult,
  IndicatorResultConfig,
  IndicatorSelection
} from './chart.models';

@Injectable()
export class ApiService {

  extraBars = 7;

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

    const green = "#2E7D32";
    const red = "#DD2C00";
    const gray = "#9E9E9E";

    const obs = new Observable((observer) => {

      // compose url
      let url = `${listing.endpoint}?`;
      selection.params.forEach((param: IndicatorParam, param_index: number) => {
        if (param_index != 0) url += "&";
        url += `${param.paramName}=${param.value}`;
      });

      // fetch data
      this.http.get(url, this.requestHeader())
        .subscribe({

          next: (apidata: any[]) => {

            // parse each dataset
            selection.results
              .forEach((result: IndicatorResult) => {

                // initialize dataset
                const config = listing.results.find(x => x.dataName == result.dataName);
                const dataset = this.initializeDataset(result, config);
                const data: ScatterDataPoint[] = [];
                const pointColor: string[] = [];
                const pointRotation: number[] = [];

                // populate data
                apidata.forEach(row => {

                  let yValue = row[result.dataName];

                  // apply candle pointers
                  if (yValue && listing.category == "candlestick-pattern") {

                    console.log("candle", row["signal"]);
                    switch (row["signal"]) {

                      case -100:
                        yValue = 1.01 * row["candle"].high;
                        pointColor.push(red);
                        pointRotation.push(180);
                        break;

                      case 100:
                        yValue = 0.99 * row["candle"].low;
                        pointColor.push(green);
                        pointRotation.push(0);
                        break;

                      default:
                        yValue = 0.99 * row["candle"].low;
                        pointColor.push(gray);
                        pointRotation.push(0);
                        break;
                    }
                  }

                  else {
                    pointColor.push(config.defaultColor);
                    pointRotation.push(0);
                  }

                  data.push({
                    x: new Date(row.date).valueOf(),
                    y: yValue
                  });
                });

                // add extra bars
                const nextDate = new Date(Math.max.apply(null, data.map(h => new Date(h.x))));

                for (let i = 1; i < this.extraBars; i++) {
                  nextDate.setDate(nextDate.getDate() + 1);
                  data.push({
                    x: new Date(nextDate).valueOf(),
                    y: null
                  });
                }

                // custom candlestick pattern points
                if (listing.category == "candlestick-pattern" && dataset.type != 'bar') {
                  dataset.pointRotation = pointRotation;
                  dataset.pointBackgroundColor = pointColor;
                  dataset.pointBorderColor = pointColor;
                }

                dataset.data = data;
                result.dataset = dataset;
              });

            observer.next(selection.results);
          },

          error: (e: HttpErrorResponse) => {
            console.log("DATA", e);
            observer.error(e);
          }
        });

    });

    return obs;
  }

  initializeDataset(r: IndicatorResult, c: IndicatorResultConfig) {

    switch (r.lineType) {

      case 'solid':
        const lineDataset: ChartDataset = {
          label: r.label,
          type: 'line',
          data: [],
          yAxisID: 'yAxis',
          pointRadius: 0,
          borderWidth: r.lineWidth,
          borderColor: r.color,
          backgroundColor: r.color,
          fill: c.fill == null ? false : {
            target: c.fill.target,
            above: c.fill.colorAbove,
            below: c.fill.colorBelow
          },
          order: r.order
        };
        return lineDataset;

      case 'dash':
        const dashDataset: ChartDataset = {
          label: r.label,
          type: 'line',
          data: [],
          yAxisID: 'yAxis',
          pointRadius: 0,
          borderWidth: r.lineWidth,
          borderDash: [3, 2],
          borderColor: r.color,
          backgroundColor: r.color,
          order: r.order
        };
        return dashDataset;

      case 'dots':
        const dotsDataset: ChartDataset = {
          label: r.label,
          type: 'line',
          data: [],
          yAxisID: 'yAxis',
          pointRadius: r.lineWidth,
          pointBorderWidth: 0,
          pointBorderColor: r.color,
          pointBackgroundColor: r.color,
          showLine: false,
          order: r.order
        };
        return dotsDataset;

      case 'bar':
        const barDataset: ChartDataset = {
          label: r.label,
          type: 'bar',
          data: [],
          yAxisID: 'yAxis',
          borderWidth: 0,
          borderColor: r.color,
          backgroundColor: r.color,
          order: r.order
        };

        // add stack, if specified
        if (c.stack) {
          barDataset.stack = c.stack;
        }
        return barDataset;

      case 'pointer':
        const ptDataset: ChartDataset = {
          label: r.label,
          type: 'line',
          data: [],
          yAxisID: 'yAxis',
          pointRadius: r.lineWidth,
          pointBorderWidth: 0,
          pointBorderColor: r.color,
          pointBackgroundColor: r.color,
          pointStyle: 'triangle',
          pointRotation: 0,
          showLine: false,
          order: r.order
        };
        return ptDataset;
    }
  }

  // HELPERS
  requestHeader(): { headers?: HttpHeaders } {

    const simpleHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json');

    return { headers: simpleHeaders };
  }
}
