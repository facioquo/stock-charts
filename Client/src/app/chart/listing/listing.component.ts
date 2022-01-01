import { Component, Inject } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import {MAT_BOTTOM_SHEET_DATA} from '@angular/material/bottom-sheet';
import { IndicatorListing } from '../api.models';

@Component({
  selector: 'app-listing',
  templateUrl: 'listing.component.html',
})
export class ListSheetComponent {


  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA)
    public data: IndicatorListing[],
    private bsRef: MatBottomSheetRef<ListSheetComponent>

  ) { }


  openLink(event: MouseEvent, indicator: IndicatorListing): void {
    this.bsRef.dismiss();
    event.preventDefault();

    
  }
}
