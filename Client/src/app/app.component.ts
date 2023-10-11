import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { StyleService } from './services/style.service';
import { SettingsComponent } from './picker/settings.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor(
    public readonly ts: StyleService,
    private readonly settingsDialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.ts.getTheme();
  }

  // SETTINGS DIALOG
  openSettingsDialog(): void {
    this.settingsDialog.open(SettingsComponent, {
      minWidth: "300px",
      maxHeight: "80vh",
      autoFocus: "dialog"
    });
  }

}
