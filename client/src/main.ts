import { bootstrapApplication } from "@angular/platform-browser";

import { setupIndyCharts } from "@facioquo/indy-charts";

import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";

setupIndyCharts();

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
