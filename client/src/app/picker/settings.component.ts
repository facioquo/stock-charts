import { Component } from '@angular/core';

import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatListOption, MatSelectionList } from '@angular/material/list';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

import { ChartService } from '../services/chart.service';
import { ConfigService } from '../services/config.service';

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

  constructor(
    private listRef: MatDialog,
    private picker: MatDialog,
    public cht: ChartService,
    public cfg: ConfigService
  ) {
    this.listings = this.cht.listings;
    this.selections = this.cht.selections;
  }

  selectDisplayed(event: MatCheckboxChange, shown: MatSelectionList): void {
    if (event.checked) shown.selectAll(); else shown.deselectAll();
  }

  removeSelections(event: MouseEvent, shown: MatListOption[]): void {
    event.preventDefault();
    shown.forEach(x => this.cht.deleteSelection(x.value.ucid));
  }

  toggleTheme(event: MatSlideToggleChange) {
    this.cfg.changeTheme(event.checked);
    this.cht.resetCharts();
  }

  toggleCrosshairs(event: MatSlideToggleChange) {
    this.cfg.changeCrosshairs(event.checked);
    this.cht.resetCharts();
  }

  toggleTooltips(event: MatSlideToggleChange) {
    this.cfg.changeTooltips(event.checked);
    this.cht.resetCharts();
  }

  openIndicatorSettings(listing: IndicatorListing): void {

    // close current settings dialog
    this.listRef.closeAll();

    // open indicator settings for indicator to add
    this.picker.open(PickConfigComponent, {
      autoFocus: "dialog",
      data: listing
    }).afterClosed()

      // reopen main settings after close
      .subscribe(() => {
        this.listRef.open(SettingsComponent, {
          autoFocus: "dialog"
        });
      });
  }

  closeListDialog() {
    this.listRef.closeAll();
  }
}
