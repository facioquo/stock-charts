import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

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
    FormsModule,

    // Materials Design
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatToolbarModule,
    MatTooltipModule,

    // Other
    FontAwesomeModule,

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
