import { NgModule } from '@angular/core';

import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import {
  ErrorStateMatcher,
  ShowOnDirtyErrorStateMatcher
} from '@angular/material/core';

import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MtxColorpickerModule } from '@ng-matero/extensions/colorpicker';
import { ColorCompactModule } from 'ngx-color/compact';

import { ChartComponent } from './chart.component';
import { PickListComponent } from './picker/pick-list.component';
import { PickFormComponent } from './picker/pick-form.component';

import { ChartService } from './chart.service';
import { ApiService } from './api.service';

@NgModule({
  declarations: [
    ChartComponent,
    PickListComponent,
    PickFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,

    MatBottomSheetModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,

    MtxColorpickerModule,
    ColorCompactModule
  ],
  exports: [
    ChartComponent,
    PickListComponent,
    PickFormComponent
  ],
  providers: [
    ChartService,
    ApiService,
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ],
  bootstrap: [ChartComponent]
})
export class ChartModule { }
