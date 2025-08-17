import { enableProdMode } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { provideRouter } from "@angular/router";

import { env } from "./environments/environment";
import { provideAnimations } from "@angular/platform-browser/animations";
import { AppComponent } from "./app/app.component";
import { routes } from "./app/app.routes";

// Register financial chart components with Chart.js
import { ensureFinancialChartsRegistered } from "./chartjs/financial";

if (env.production) {
  enableProdMode();
}

// Ensure financial chart components are registered once during app bootstrap
ensureFinancialChartsRegistered();

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(routes)
  ]
}).catch(err => console.error(err));
