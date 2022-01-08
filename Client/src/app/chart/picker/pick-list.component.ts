import { Component, Inject } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { IndicatorListing } from '../chart.models';

@Component({
  selector: 'app-listing',
  templateUrl: 'pick-list.component.html',
  styleUrls: ['../chart.component.scss']
})
export class PickListComponent {

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA)
    public data: IndicatorListing[],
    private bsRef: MatBottomSheetRef<PickListComponent>
  ) { }


  openLink(event: MouseEvent, listing: IndicatorListing): void {
    this.bsRef.dismiss(listing);
    event.preventDefault();
  }
}
