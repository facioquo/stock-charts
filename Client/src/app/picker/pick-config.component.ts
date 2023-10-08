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

interface LineStyle {
  name: string;
  value: string;
}

@Component({
  selector: 'app-pick-config',
  templateUrl: 'pick-config.component.html',
  styleUrls: ['pick-config.component.scss']
})
export class PickConfigComponent {

  selection: IndicatorSelection;
  customPicker: MtxColorpicker;
  errorMessage: string;
  closeButtonLabel = "Add";

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
    { name: "thick", value: 2 }
  ];

  lineStyles: LineStyle[] = [
    { name: "solid", value: "solid" },
    { name: "dashes", value: "dash" },
    { name: "dots", value: "dots" },
    { name: "bar", value: "bar" }
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
          this.closeButtonLabel = "Resolved ...";
          this.dialogRef.close();
        },
        error: (e: HttpErrorResponse) => {
          console.log(e);
          this.errorMessage = e.error;
          this.closeButtonLabel = "Retry";
        }
      });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  paramRangeError(param: IndicatorParam): string {
    return `Valid range is ${param.minimum} to ${param.maximum}`;
  }

  getHex8(e: ColorEvent): string {
    const alpha = e.color.rgb.a;
    return alpha === 1 ? e.color.hex : new TinyColor(e.color.rgb).toHex8String();
  }
}
