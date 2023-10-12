import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { StyleService } from './services/style.service';
import { SettingsComponent } from './picker/settings.component';
import { ChartService } from './services/chart.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor(
    public readonly cs: ChartService,
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
      maxHeight: "90vh",
      autoFocus: "dialog"
    });
  }

}
