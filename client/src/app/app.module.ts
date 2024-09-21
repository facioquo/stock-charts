import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';

import {
  provideHttpClient,
  withInterceptorsFromDi
} from '@angular/common/http';

import {
  ErrorStateMatcher,
  ShowOnDirtyErrorStateMatcher
} from '@angular/material/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ChartModule } from './chart/chart.module';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { ApiService } from './services/api.service';
import { ChartControlService } from './services/chart-control.service';
import { ChartConfigService } from './services/chart-config.service';
import { UserConfigService } from './services/user-config.service';

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
    ApiService,
    {
      provide: ErrorStateMatcher,
      useClass: ShowOnDirtyErrorStateMatcher
    },
    ChartControlService,
    ChartConfigService,
    UserConfigService,
    provideHttpClient(withInterceptorsFromDi())
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
