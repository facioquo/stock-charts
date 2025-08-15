import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
import { UtilityService } from "../../services/utility.service";

@Component({
  selector: "app-404",
  templateUrl: "./404.component.html",
  styleUrls: ["./404.component.scss"],
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageNotFoundComponent {
  private readonly util = inject(UtilityService);

  constructor() {
    const description = "This is not a page.  Try again.";

    this.util.pushMetaTags([
      {
        name: "robots",
        content: "noindex, nofollow",
      },
      {
        property: "og:title",
        content: "Page not found",
      },
      {
        name: "description",
        content: description,
      },
      {
        property: "og:description",
        content: description,
      },
    ]);
  }
}
