import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ChartComponent } from './chart.component';

@NgModule({
  declarations: [
    ChartComponent
  ],
  exports: [
    ChartComponent
  ],
  bootstrap: [
    ChartComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatToolbarModule,
    MatTooltipModule
  ],
  providers: []
})
export class ChartModule { }
