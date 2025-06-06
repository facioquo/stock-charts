import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { ChartComponent } from "./chart.component";

const routes: Routes = [
  {
    path: "", // "" for lazy-loading, see AppRoutingModule
    component: ChartComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChartRoutingModule { }
