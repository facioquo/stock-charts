import { Component } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';

import { IndicatorListing, IndicatorSelection } from '../chart.models';
import { ChartService } from '../chart.service';
import { PickFormComponent } from '../picker/pick-form.component';

@Component({
  selector: 'app-listing',
  templateUrl: 'pick-list.component.html',
  styleUrls: ['../chart.component.scss']
})
export class PickListComponent {

  listings: IndicatorListing[];
  selections: IndicatorSelection[];

  constructor(
    private bsRef: MatBottomSheetRef<PickListComponent>,
    private cs: ChartService,
    private dialog: MatDialog
  ) {
    this.listings = this.cs.listings;
    this.selections = this.cs.selections;
  }


  openEditor(event: MouseEvent, listing: IndicatorListing): void {
    this.bsRef.dismiss(listing);
    event.preventDefault();

    const dialogRef = this.dialog.open(PickFormComponent, {
      minWidth: '300px',
      data: listing
    });

    dialogRef.afterClosed()
      .subscribe((selection: IndicatorSelection) => { });
  }

  removeSelection(event: MouseEvent, ucid: string): void {
    this.bsRef.dismiss();
    event.preventDefault();
    this.cs.deleteSelection(ucid);
  }

}
