import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

// services
import { ChartService } from '../../services/chart.service';
import { ChartConfigService } from '../../services/config.service';

// component
import { ChartComponent } from './chart.component';
import { ChartRoutingModule } from './chart-routing.module';

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
    ChartRoutingModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatToolbarModule,
    MatTooltipModule
  ],
  providers: [
    ChartService,
    ChartConfigService
  ]
})
export class ChartModule { }
