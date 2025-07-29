import { Component, OnInit, inject } from "@angular/core";
import { UserService } from "./services/user.service";
import { MatToolbar } from "@angular/material/toolbar";
import { RouterOutlet } from "@angular/router";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
    imports: [MatToolbar, RouterOutlet]
})
export class AppComponent implements OnInit {
  private readonly usr = inject(UserService);


  ngOnInit(): void {

    // load/apply user prefs
    this.usr.loadSettings();
  }
}
