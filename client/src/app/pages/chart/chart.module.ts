import { NgModule } from "@angular/core";
import { NgIf, NgFor } from "@angular/common";

import {
  provideHttpClient,
  withInterceptorsFromDi
} from "@angular/common/http";

import {
  ErrorStateMatcher,
  ShowOnDirtyErrorStateMatcher
} from "@angular/material/core";

import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatSelectModule } from "@angular/material/select";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTooltipModule } from "@angular/material/tooltip";

// services
import { ApiService } from "../../services/api.service";
import { ChartService } from "../../services/chart.service";

// component
import { ChartComponent } from "./chart.component";
import { ChartRoutingModule } from "./chart-routing.module";

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
    NgIf,
    NgFor,
    ChartRoutingModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatToolbarModule,
    MatTooltipModule
  ],
  providers: [
    ApiService,
    {
      provide: ErrorStateMatcher,
      useClass: ShowOnDirtyErrorStateMatcher
    },
    provideHttpClient(withInterceptorsFromDi()),
    ChartService
  ]
})
export class ChartModule { }
