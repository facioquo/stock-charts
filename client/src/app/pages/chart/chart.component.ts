import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { ChartService } from '../../services/chart.service';
import { SettingsComponent } from '../../components/picker/settings.component';

@Component({
    selector: 'app-chart',
    templateUrl: './chart.component.html',
    styleUrls: ['./chart.component.scss'],
    standalone: false
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
      autoFocus: 'dialog'
    });
  }
}
