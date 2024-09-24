import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SettingsComponent } from './picker/settings.component';

import { ChartService } from './services/chart.service';
import { UserConfigService } from './services/user-config.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor(
    public readonly cht: ChartService,
    private readonly usr: UserConfigService,
    private readonly settingsDialog: MatDialog
  ) { }

  ngOnInit(): void {

    // load/apply user prefs
    this.usr.initSettings();
  }

  // SETTINGS DIALOG
  openSettingsDialog(): void {
    this.settingsDialog.open(SettingsComponent, {
      autoFocus: "dialog"
    });
  }
}
