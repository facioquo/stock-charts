import { Component, OnInit } from '@angular/core';
import { ChartService } from '../services/chart.service';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
})
export class ChartComponent implements OnInit {

  constructor(
    public readonly cs: ChartService
  ) { }

  ngOnInit(): void {
    this.cs.loadCharts();
  }
}
