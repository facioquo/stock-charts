import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ChartModule } from './chart/chart.module';

import { ConfigService } from './services/config.service';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ApiService } from './services/api.service';

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
    ChartModule,
    AppRoutingModule
  ],
  providers: [
    ConfigService,
    ApiService
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
