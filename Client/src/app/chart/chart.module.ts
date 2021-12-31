import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChartComponent } from './chart.component';
import { ChartService } from './chart.service';

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
    ChartService
  ],
  bootstrap: [ChartComponent]
})
export class ChartModule { }
