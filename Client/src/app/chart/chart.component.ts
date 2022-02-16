import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { ChartService } from './chart.service';

import { PickListComponent } from './picker/pick-list.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit {

  constructor(
    public readonly cs: ChartService,
    private readonly bs: MatBottomSheet
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

  // PICKERS
  openPickList(): void {
    const bsRef = this.bs.open(PickListComponent);
  }
}
