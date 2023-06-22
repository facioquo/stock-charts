import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';

import { MatButtonModule as MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule as MatTooltipModule } from '@angular/material/tooltip';

import { AppComponent } from './app.component';
import { StyleService } from './style.service';
import { ChartModule } from './chart/chart.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [

    // Angular
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,

    // Materials Design
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatTooltipModule,

    // Application
    ChartModule
  ],
  providers: [
    StyleService
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
