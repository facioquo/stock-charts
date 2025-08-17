import { enableProdMode } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { provideRouter } from "@angular/router";

import { env } from "./environments/environment";
import { provideAnimations } from "@angular/platform-browser/animations";
import { AppComponent } from "./app/app.component";
import { routes } from "./app/app.routes";

// Register financial chart components once during application bootstrap
import { ensureFinancialChartsRegistered } from "./chartjs/financial";

if (env.production) {
  enableProdMode();
}

// Register financial charts once during bootstrap
ensureFinancialChartsRegistered();

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(routes)
  ]
}).catch(err => console.error(err));
