import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChartComponent } from './chart.component';
import { ChartService } from './chart.service';
import { ApiService } from './api.service';

@NgModule({
  declarations: [
    ChartComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ChartComponent
  ],
  providers: [
    ChartService,
    ApiService
  ],
  bootstrap: [ChartComponent]
})
export class ChartModule { }
