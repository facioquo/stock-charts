import { Component, OnInit } from '@angular/core';
import { StyleService } from './style.service';

import { PickListComponent } from './chart/picker/pick-list.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor(
    public readonly ts: StyleService,
    private readonly list: MatDialog
  ) { }

  ngOnInit(): void {
    this.ts.getTheme();
  }

  // PICKERS
  openPickList(): void {
    this.list.open(PickListComponent, {
      minWidth: '300px',
      maxHeight: '80vh'
    });
  }

}
