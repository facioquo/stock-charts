import { NgModule } from "@angular/core";

import { PageNotFoundRoutingModule } from "./404-routing.module";
import { PageNotFoundComponent } from "./404.component";

@NgModule({
  declarations: [
    PageNotFoundComponent
  ],
  imports: [
    PageNotFoundRoutingModule
  ]
})
export class PageNotFoundModule { }
