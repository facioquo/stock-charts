import { Component } from '@angular/core';

import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatListOption, MatSelectionList } from '@angular/material/list';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

import { StyleService } from '../services/style.service';
import { ChartService } from '../services/chart.service';

import { IndicatorListing, IndicatorSelection } from '../chart/chart.models';
import { PickConfigComponent } from './pick-config.component';

@Component({
  selector: 'app-listing',
  templateUrl: 'settings.component.html',
  styleUrls: ['settings.component.scss']
})
export class SettingsComponent {

  listings: IndicatorListing[];
  selections: IndicatorSelection[];
  toggleColor = "accent";

  constructor(
    private listRef: MatDialog,
    private picker: MatDialog,
    private cs: ChartService,
    public ts: StyleService,
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
    this.picker.open(PickConfigComponent, {
      minWidth: '300px',
      maxHeight: "90vh",
      autoFocus: "dialog",
      data: listing
    });
  }

  closeListDialog() {
    this.listRef.closeAll();
  }
}
