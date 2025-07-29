import { Component, inject } from "@angular/core";

import { MatCheckboxChange, MatCheckbox } from "@angular/material/checkbox";
import { MatDialog, MatDialogContent } from "@angular/material/dialog";
import { MatListOption, MatSelectionList, MatList, MatListItem, MatListItemTitle, MatNavList, MatListItemLine } from "@angular/material/list";
import { MatSlideToggleChange, MatSlideToggle } from "@angular/material/slide-toggle";

import { ChartService } from "../../services/chart.service";
import { UserService } from "../../services/user.service";

import { IndicatorListing, IndicatorSelection } from "../../pages/chart/chart.models";
import { PickConfigComponent } from "./pick-config.component";
import { MatToolbar } from "@angular/material/toolbar";
import { MatIconButton, MatButton } from "@angular/material/button";
import { MatTooltip } from "@angular/material/tooltip";
import { MatIcon } from "@angular/material/icon";
import { CdkScrollable } from "@angular/cdk/scrolling";
import { FormsModule } from "@angular/forms";
import { NgIf, NgFor } from "@angular/common";

@Component({
    selector: "app-listing",
    templateUrl: "settings.component.html",
    styleUrls: ["settings.component.scss"],
    imports: [MatToolbar, MatIconButton, MatTooltip, MatIcon, CdkScrollable, MatDialogContent, MatList, MatListItem, MatSlideToggle, FormsModule, NgIf, MatSelectionList, MatCheckbox, NgFor, MatListOption, MatListItemTitle, MatButton, MatNavList, MatListItemLine]
})
export class SettingsComponent {
  private listRef = inject(MatDialog);
  private picker = inject(MatDialog);
  cht = inject(ChartService);
  usr = inject(UserService);


  listings: IndicatorListing[];
  selections: IndicatorSelection[];

  constructor() {
    this.listings = this.cht.listings;
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
