import { Component, inject } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";

import { ChartService } from "../../services/chart.service";
import { SettingsComponent } from "../../components/picker/settings.component";

@Component({
    selector: "app-chart",
    templateUrl: "./chart.component.html",
    styleUrls: ["./chart.component.scss"],
    standalone: false
})
export class ChartComponent {
  readonly cht = inject(ChartService);
  private readonly settingsDialog = inject(MatDialog);


  constructor() {
    this.cht.loadCharts();
  }

  // SETTINGS DIALOG
  openSettingsDialog(): void {
    this.settingsDialog.open(SettingsComponent, {
      autoFocus: "dialog"
    });
  }
}
