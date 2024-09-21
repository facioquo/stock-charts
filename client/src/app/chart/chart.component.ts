import { Component, ViewEncapsulation } from '@angular/core';
import { ChartControlService } from '../services/chart-control.service';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],

  // allows injected HTML to get styles?
  // see https://github.com/angular/angular/issues/7845
  encapsulation: ViewEncapsulation.None
})
export class ChartComponent {

  constructor(
    public readonly cht: ChartControlService
  ) {
    this.cht.loadCharts();
  }
}
