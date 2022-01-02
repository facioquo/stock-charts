import { Component, Inject } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { IndicatorListing, IndicatorSelection } from '../chart.models';
import { PickFormComponent } from './pick-form.component';

@Component({
  selector: 'app-listing',
  templateUrl: 'pick-list.component.html',
  styleUrls: ['../chart.component.scss']
})
export class PickListComponent {

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA)
    public data: IndicatorListing[],
    public dialog: MatDialog,
    private bsRef: MatBottomSheetRef<PickListComponent>
  ) { }


  openLink(event: MouseEvent, indicator: IndicatorListing): void {
    this.bsRef.dismiss();
    event.preventDefault();

    this.openDialog(indicator);
  }

  openDialog(indicator: IndicatorListing): void {

    const dialogConfig = new MatDialogConfig();
    dialogConfig.minWidth = 300;
    dialogConfig.data = indicator;

    const dialogRef = this.dialog.open(PickFormComponent, dialogConfig);

    dialogRef.afterClosed().subscribe((selection:IndicatorSelection) => {
      console.log(`The dialog was closed for ${selection.label}`);
    });
  }
}
