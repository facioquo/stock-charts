import { NgModule } from "@angular/core";
import {
  RouterModule,
  Routes
} from "@angular/router";

const routes: Routes = [
  {
    path: "",
    loadChildren: () => import("./pages/chart/chart.module")
      .then(m => m.ChartModule)
  },

  {
    path: "settings",
    loadChildren: () => import("./components/picker/settings.module")
      .then(m => m.SettingsModule)
  },

  // 404 page (route not found)
  {
    path: "**",
    loadChildren: () => import("./pages/404/404.module")
      .then(m => m.PageNotFoundModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
