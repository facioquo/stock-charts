import { enableProdMode } from "@angular/core";
import { platformBrowser } from "@angular/platform-browser";

import { AppModule } from "./app/app.module";
import { env } from "./environments/environment";

if (env.production) {
  enableProdMode();
}

platformBrowser()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));
