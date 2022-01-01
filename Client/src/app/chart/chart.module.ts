import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ChartComponent } from './chart.component';
import { ListSheetComponent } from './listing/listing.component';

import { ChartService } from './chart.service';
import { ApiService } from './api.service';

@NgModule({
  declarations: [
    ChartComponent,
    ListSheetComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,

    MatBottomSheetModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatTooltipModule
  ],
  exports: [
    ChartComponent
  ],
  providers: [
    ChartService,
    ApiService,
    ListSheetComponent
  ],
  bootstrap: [ChartComponent]
})
export class ChartModule { }
