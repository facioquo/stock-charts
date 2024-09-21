import { Component } from '@angular/core';

import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatListOption, MatSelectionList } from '@angular/material/list';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

import { ChartControlService } from '../services/chart-control.service';
import { UserConfigService } from '../services/user-config.service';

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
    public cht: ChartControlService,
    public usr: UserConfigService
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
    this.usr.changeTheme(event.checked);
    this.cht.onSettingsChange();
  }

  toggleCrosshairs(event: MatSlideToggleChange) {
    this.usr.changeCrosshairs(event.checked);
    this.cht.onSettingsChange();
  }

  toggleTooltips(event: MatSlideToggleChange) {
    this.usr.changeTooltips(event.checked);
    this.cht.onSettingsChange();
  }

  openIndicatorSettings(listing: IndicatorListing): void {

    // close current settings dialog
    this.listRef.closeAll();

    // open indicator settings for indicator to add
    this.picker
      .open(PickConfigComponent, {
        autoFocus: "dialog",
        data: listing
       })
      .afterClosed()

      // reopen main settings after close
      // TODO: return "reopen" choice, not just close
      // TODO: scroll to chart if not reopened
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
