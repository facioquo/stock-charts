import { NgModule } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
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

import { SettingsComponent } from './settings.component';
import { PickConfigComponent } from './pick-config.component';

@NgModule({
  declarations: [
    SettingsComponent,
    PickConfigComponent
  ],
  exports: [
    SettingsComponent,
    PickConfigComponent
  ],
  bootstrap: [],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
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
  providers: []
})
export class SettingsModule { }
