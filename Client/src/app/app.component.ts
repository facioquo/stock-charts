import { Component } from '@angular/core';
import { StyleService } from './style.service';

import { PickListComponent } from './chart/picker/pick-list.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(
    public readonly ts: StyleService,
    private readonly settingsDialog: MatDialog
  ) {
    this.ts.getTheme();
  }

  // SETTINGS DIALOG
  openSettingsDialog(): void {
    this.settingsDialog.open(PickListComponent, {
      minWidth: '300px',
      maxHeight: '80vh'
    });
  }

}
