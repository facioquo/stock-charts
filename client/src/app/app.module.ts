import { NgModule } from '@angular/core';
import { BrowserModule,  } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import {
  provideHttpClient,
  withInterceptorsFromDi
} from '@angular/common/http';

import {
  ErrorStateMatcher,
  ShowOnDirtyErrorStateMatcher
} from '@angular/material/core';

import { MatToolbarModule } from '@angular/material/toolbar';

// services (global)
import { ApiService } from './services/api.service';
import { UserService } from './services/user.service';
import { UtilityService } from './services/utility.service';

// component
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [

    // Angular
    BrowserModule,
    BrowserAnimationsModule,

    // Materials Design
    MatToolbarModule,

    // Application
    AppRoutingModule
  ],
  providers: [
    ApiService,
    {
      provide: ErrorStateMatcher,
      useClass: ShowOnDirtyErrorStateMatcher
    },
    provideHttpClient(withInterceptorsFromDi()),

    UserService,
    UtilityService
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
