import { NgModule } from "@angular/core";
import {
  RouterModule,
  Routes
} from "@angular/router";

const routes: Routes = [
  {
    path: "",
    loadComponent: () => import("./pages/chart/chart.component")
      .then(m => m.ChartComponent)
  },

  {
    path: "settings",
    loadComponent: () => import("./components/picker/settings.component")
      .then(m => m.SettingsComponent)
  },

  // 404 page (route not found)
  {
    path: "**",
    loadComponent: () => import("./pages/404/404.component")
      .then(m => m.PageNotFoundComponent)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
