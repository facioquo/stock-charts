import { Component, Inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { MtxColorpicker } from '@ng-matero/extensions/colorpicker';
import { ColorEvent } from 'ngx-color';
import { TinyColor } from '@ctrl/tinycolor';

import { ApiService } from '../services/api.service';
import { ChartService } from '../services/chart.service';

import {
  IndicatorListing,
  IndicatorParam,
  IndicatorSelection
} from '../chart/chart.models';

interface LineWidth {
  name: string;
  value: number;
}

interface LineType {
  name: string;
  value: string;
  userWidth: boolean;  // user can specify width
}

@Component({
  selector: 'app-pick-config',
  templateUrl: 'pick-config.component.html',
  styleUrls: ['pick-config.component.scss']
})
export class PickConfigComponent {

  // ref: https://ng-matero.github.io/extensions/components/colorpicker

  selection: IndicatorSelection;
  customPicker: MtxColorpicker;
  errorMessage: string;
  closeButtonLabel = "ADD";

  presetColors: string[] = [
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

  lineWidths: LineWidth[] = [
    { name: "thin", value: 1 },
    { name: "normal", value: 1.5 },
    { name: "thick", value: 2 },
    { name: "heavy", value: 3 }
  ];

  lineTypes: LineType[] = [
    { name: "solid", value: "solid", userWidth: true },
    { name: "dashes", value: "dash", userWidth: true },
    { name: "dots", value: "dots", userWidth: true },
    { name: "bar", value: "bar", userWidth: false },
    { name: "none", value: "none", userWidth: false }
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public listing: IndicatorListing,
    private dialogRef: MatDialogRef<PickConfigComponent>,
    private cs: ChartService,
    private api: ApiService
  ) {

    // pre-populate selection
    this.selection = this.cs.defaultSelection(listing.uiid);
  }


  onSubmit(): void {

    this.api.getSelection(this.selection, this.listing)
      .subscribe({
        next: (selectionWithData: IndicatorSelection) => {

          this.cs.displaySelection(selectionWithData, this.listing, true);
          this.errorMessage = undefined;
          this.closeButtonLabel = "RESOLVED ...";
          this.dialogRef.close();
        },
        error: (e: HttpErrorResponse) => {
          console.log(e);
          this.errorMessage = e.error;
          this.closeButtonLabel = "RETRY";
        }
      });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  paramRangeError(param: IndicatorParam): string {
    return `Valid range is ${param.minimum} to ${param.maximum}`;
  }

  getColor(e: ColorEvent, picker: MtxColorpicker): string {
    const color = e.color.rgb.a === 1 ? e.color.hex : new TinyColor(e.color.rgb).toHex8String();
    picker.close();
    return color.toUpperCase();
  }

  userSpecifiedWidth(lineValue: string): boolean {
    return this.lineTypes.find(x => x.value === lineValue)?.userWidth ?? true;
  }
}
