import { Component } from '@angular/core';

import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatListOption, MatSelectionList } from '@angular/material/list';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

import { StyleService } from 'src/app/style.service';
import { ChartService } from '../chart.service';

import { IndicatorListing, IndicatorSelection } from '../chart.models';
import { PickFormComponent } from '../picker/pick-form.component';

@Component({
  selector: 'app-listing',
  templateUrl: 'pick-list.component.html',
  styleUrls: ['pick-list.component.scss']
})
export class PickListComponent {

  listings: IndicatorListing[];
  selections: IndicatorSelection[];
  toggleColor = "accent";

  constructor(
    public ts: StyleService,
    private cs: ChartService,
    private listRef: MatDialog,
    private picker: MatDialog
  ) {
    this.listings = this.cs.listings;
    this.selections = this.cs.selections;
  }

  selectDisplayed(event: MatCheckboxChange, shown: MatSelectionList): void {
    if (event.checked) shown.selectAll(); else shown.deselectAll();
  }

  removeSelections(event: MouseEvent, shown: MatListOption[]): void {
    event.preventDefault();
    shown.forEach(x => this.cs.deleteSelection(x.value.ucid));
  }

  toggleTheme(event: MatSlideToggleChange) {
    this.ts.toggleTheme(event.checked);
    this.cs.resetChartTheme();
  }

  openIndicatorSettings(listing: IndicatorListing): void {

    // close current settings dialog
    this.listRef.closeAll();

    // open settings for indicator to add
    this.picker.open(PickFormComponent, {
      minWidth: '300px',
      data: listing
    });
  }

  closeListDialog() {
    this.listRef.closeAll();
  }
}
