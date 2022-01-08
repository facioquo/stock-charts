import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import Chart from 'chart.js/auto';  // import all default options
import { FinancialDataPoint, ScatterDataPoint } from 'chart.js';

import { ApiService } from './api.service';
import { ChartService } from './chart.service';
import {
  Quote,
  IndicatorListing,
  IndicatorSelection,
} from './chart.models';

import { PickListComponent } from './picker/pick-list.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { PickFormComponent } from './picker/pick-form.component';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit {

  constructor(
    private readonly cs: ChartService,
    private readonly api: ApiService,
    private readonly bs: MatBottomSheet,
    private dialog: MatDialog,
  ) { }

  @ViewChild('chartsTop') chartTopRef: ElementRef;
  loading = true;

  // STARTUP OPERATIONS

  ngOnInit() {
    this.startup();
  }

  startup() {

    this.api.getQuotes()
      .subscribe({
        next: (q: Quote[]) => {

          this.loadOverlayChart(q);

          // load default selections
          this.api.getListings()
            .subscribe({
              next: (listings: IndicatorListing[]) => {
                this.cs.listings = listings;
                this.loadSelections()
              },
              error: (e: HttpErrorResponse) => { console.log(e); }
            });
        },
        error: (e: HttpErrorResponse) => { console.log(e); }
      });
  }

  loadOverlayChart(quotes: Quote[]) {

    const chartConfig = this.cs.baseOverlayConfig();
    const candleOptions = Chart.defaults.elements["candlestick"];

    // custom border colors
    candleOptions.color.up = '#1B5E20';
    candleOptions.color.down = '#B71C1C';
    candleOptions.color.unchanged = '#616161';

    candleOptions.borderColor = {
      up: candleOptions.color.up,
      down: candleOptions.color.down,
      unchanged: candleOptions.color.unchanged
    };

    const price: FinancialDataPoint[] = [];
    const volume: ScatterDataPoint[] = [];
    const barColor: string[] = [];

    let sumVol = 0;

    quotes.forEach((q: Quote) => {

      price.push({
        x: new Date(q.date).valueOf(),
        o: q.open,
        h: q.high,
        l: q.low,
        c: q.close
      });

      volume.push({
        x: new Date(q.date).valueOf(),
        y: q.volume
      });
      sumVol += q.volume;

      const c = (q.close >= q.open) ? '#1B5E2060' : '#B71C1C60';
      barColor.push(c);
    });

    // define base datasets
    chartConfig.data = {
      datasets: [
        {
          type: 'candlestick',
          label: 'Price',
          data: price,
          yAxisID: 'yAxis',
          borderColor: candleOptions.borderColor,
          order: 75
        },
        {
          type: 'bar',
          label: 'Volume',
          data: volume,
          yAxisID: 'volumeAxis',
          backgroundColor: barColor,
          borderWidth: 0,
          order: 76
        }
      ]
    };

    // get size for volume axis
    const volumeAxisSize = 20 * (sumVol / volume.length) || 0;
    chartConfig.options.scales.volumeAxis.max = volumeAxisSize;

    // compose chart
    if (this.cs.chartOverlay) this.cs.chartOverlay.destroy();
    const myCanvas = document.getElementById("chartOverlay") as HTMLCanvasElement;
    this.cs.chartOverlay = new Chart(myCanvas.getContext('2d'), chartConfig);
    this.loading = false;
  }

  loadSelections() {

    // TODO: get from cache or use defaults if none

    const selectDefault2 = this.cs.defaultSelection("EMA");
    const selectFinal2 = this.cs.selectionTokenReplacement(selectDefault2);
    this.cs.addSelection(selectFinal2);

    const selectDefault3 = this.cs.defaultSelection("BB");
    const selectFinal3 = this.cs.selectionTokenReplacement(selectDefault3);
    this.cs.addSelection(selectFinal3);

    const selectDefault4 = this.cs.defaultSelection("STO");
    const selectFinal4 = this.cs.selectionTokenReplacement(selectDefault4);
    this.cs.addSelection(selectFinal4);

    const selectDefault5 = this.cs.defaultSelection("RSI");
    selectDefault5.params.find(x => x.paramName == "lookbackPeriods").value = 5;
    const selectFinal5 = this.cs.selectionTokenReplacement(selectDefault5);
    this.cs.addSelection(selectFinal5);
  }


  // PICKERS
  openPickList(): void {

    const bsRef = this.bs.open(PickListComponent, { data: this.cs.listings });

    bsRef.afterDismissed()
      .subscribe((listing: IndicatorListing) => {

        if (listing){
          this.openPickDialog(listing);
        }
      });
  }

  openPickDialog(listing: IndicatorListing): void {

    const dialogRef = this.dialog.open(PickFormComponent, {
      minWidth: '300px',
      data: listing
    });

    dialogRef.afterClosed()
      .subscribe((selection: IndicatorSelection) => {
        console.log(`The dialog was closed for ${selection.label}`);

        if (selection)
          this.cs.addSelection(selection);
      });
  }

  // DATA OPERATIONS
  updateData() {

    // update selections data
    this.cs.selections.forEach((selection: IndicatorSelection) => {

      // lookup config data
      const listing = this.cs.listings.find(x => x.uiid == selection.uiid);

      this.api.getSelectionData(selection, listing)
        .subscribe({
          next: () => {
            if (listing.chartType != 'overlay') {
              selection.chart.update();
            };
          },
          error: (e: HttpErrorResponse) => { console.log(e); }
        });
    });

    // update primary data
    this.api.getQuotes()
      .subscribe({
        next: (quotes: Quote[]) => {

          // TODO: refactor redundant code (see load)
          const price: FinancialDataPoint[] = [];
          const volume: ScatterDataPoint[] = [];
          let sumVol = 0;

          quotes.forEach((q: Quote) => {
            price.push({
              x: new Date(q.date).valueOf(),
              o: q.open,
              h: q.high,
              l: q.low,
              c: q.close
            });
            volume.push({
              x: new Date(q.date).valueOf(),
              y: q.volume
            });
            sumVol += q.volume;

            // get size for volume axis
            const volumeAxisSize = 20 * (sumVol / volume.length) || 0;
            this.cs.chartOverlay.options.scales.volumeAxis.max = volumeAxisSize;
            this.cs.chartOverlay.update();
          });
        },
        error: (e: HttpErrorResponse) => { console.log(e); }
      });
  }


  // HELPERS
  scrollToChartTop() {
    setTimeout(() => {
      this.chartTopRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' });
    }, 200);
  }
}
