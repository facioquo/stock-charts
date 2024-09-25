import { Component, ViewEncapsulation } from '@angular/core';
import { ChartService } from '../services/chart.service';
import { SettingsComponent } from '../picker/settings.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],

  // allows injected HTML to get styles?
  // see https://github.com/angular/angular/issues/7845
  encapsulation: ViewEncapsulation.None
})
export class ChartComponent {

  constructor(
    public readonly cht: ChartService,
    private readonly settingsDialog: MatDialog
  ) {
    this.cht.loadCharts();
  }

  // SETTINGS DIALOG
  openSettingsDialog(): void {
    this.settingsDialog.open(SettingsComponent, {
      autoFocus: "dialog"
    });
  }
}
