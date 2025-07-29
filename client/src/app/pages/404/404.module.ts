import { NgModule } from "@angular/core";

import { PageNotFoundRoutingModule } from "./404-routing.module";
import { PageNotFoundComponent } from "./404.component";

@NgModule({
    imports: [
        PageNotFoundRoutingModule,
        PageNotFoundComponent
    ]
})
export class PageNotFoundModule { }
