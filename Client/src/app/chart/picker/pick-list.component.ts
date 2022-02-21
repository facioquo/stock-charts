import { Component } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';

import { StyleService } from 'src/app/style.service';

import { IndicatorListing, IndicatorSelection } from '../chart.models';
import { ChartService } from '../chart.service';
import { PickFormComponent } from '../picker/pick-form.component';

@Component({
  selector: 'app-listing',
  templateUrl: 'pick-list.component.html',
  styleUrls: ['pick-list.component.scss']
})
export class PickListComponent {

  listings: IndicatorListing[];
  selections: IndicatorSelection[];
  toggleColor = "warn";

  constructor(
    public ts: StyleService,
    private cs: ChartService,
    private listRef: MatDialog,
    private picker: MatDialog
  ) {
    this.listings = this.cs.listings;
    this.selections = this.cs.selections;
  }

  openEditor(event: MouseEvent, listing: IndicatorListing): void {
    event.preventDefault();
    this.listRef.closeAll();

    const pickerRef = this.picker.open(PickFormComponent, {
      minWidth: '300px',
      data: listing
    });

    pickerRef.afterClosed()
      .subscribe((selection: IndicatorSelection) => { });
  }

  removeSelection(event: MouseEvent, ucid: string): void {
    event.preventDefault();
    // this.listRef.closeAll();
    this.cs.deleteSelection(ucid);
  }

  toggleTheme(event: MatSlideToggleChange) {
    this.ts.toggleTheme(event.checked);
    this.cs.resetChartTheme();
  }

  closeListDialog() {
    this.listRef.closeAll();
  }
}
