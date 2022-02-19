import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { ChartService } from './chart.service';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit {

  constructor(
    public readonly cs: ChartService
  ) { }

  loading = true;

  // STARTUP OPERATIONS
  ngOnInit() {
    this.startup();
  }

  startup() {
    this.cs.loadCharts();
    this.loading = false;
  }
}
