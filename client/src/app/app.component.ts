import { Component, OnInit, inject } from "@angular/core";
import { UserService } from "./services/user.service";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
    standalone: false
})
export class AppComponent implements OnInit {
  private readonly usr = inject(UserService);


  ngOnInit(): void {

    // load/apply user prefs
    this.usr.loadSettings();
  }
}
