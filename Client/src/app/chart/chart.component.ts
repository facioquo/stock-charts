import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import { ChartService } from './chart.service';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],

  // allows injected HTML to get styles?
  // see https://github.com/angular/angular/issues/7845
  encapsulation: ViewEncapsulation.None
})
export class ChartComponent implements OnInit {

  constructor(
    public readonly cs: ChartService
  ) { }

    // STARTUP OPERATIONS
  ngOnInit() {
    this.startup();
  }

  startup() {
    this.cs.loadCharts();
  }
}
