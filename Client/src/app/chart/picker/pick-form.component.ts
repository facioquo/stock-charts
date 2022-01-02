import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { MtxColorpicker } from '@ng-matero/extensions/colorpicker';
import { ColorEvent } from 'ngx-color';
import { TinyColor } from '@ctrl/tinycolor';

import { ChartService } from '../chart.service';
import { IndicatorListing, IndicatorSelection } from '../chart.models';

@Component({
  selector: 'app-listing',
  templateUrl: 'pick-form.component.html',
  styleUrls: ['pick-form.component.scss']
})
export class PickFormComponent {

  selection: IndicatorSelection;
  customPicker: MtxColorpicker;

  presetColors = [
    '#DD2C00', // deep orange A700 (red)
    '#EF6C00', // orange 800
    '#FDD835', // yellow 600
    '#C0CA33', // lime 600
    '#7CB342', // light green 600
    '#2E7D32', // green 800
    '#009688', // teal 500
    '#1E88E5', // blue 600
    '#1565C0', // blue 800
    '#3949AB', // indigo 600
    '#6A1B9A', // purple 800
    '#8E24AA', // purple 600
    '#EC407A', // pink 400
    '#757575', // gray 600
    '#9E9E9E', // gray 500
    '#BDBDBD'] // gray 400;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public indicator: IndicatorListing,
    private dialogRef: MatDialogRef<PickFormComponent>,
    private cs: ChartService
  ) {

    // pre-populate selection
    console.log("opening", indicator.name);
    this.selection = this.cs.defaultIndicatorSelection(indicator.uiid);
  }


  onSubmit(): void {

    // label token replacement
    this.selection = this.cs.selectionTokenReplacment(this.selection);
    this.dialogRef.close;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  getHex8(e: ColorEvent): string {
    const alpha = e.color.rgb.a;
    return alpha === 1 ? e.color.hex : new TinyColor(e.color.rgb).toHex8String();
  }
}
