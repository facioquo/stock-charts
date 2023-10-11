import { NgModule } from '@angular/core';

import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ChartComponent } from './chart.component';

import { ChartService } from '../services/chart.service';

@NgModule({
  declarations: [
    ChartComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,

    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatToolbarModule,
    MatTooltipModule
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
