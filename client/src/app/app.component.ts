import { ChangeDetectionStrategy, Component, OnInit, inject } from "@angular/core";
import { MatToolbar } from "@angular/material/toolbar";
import { RouterOutlet } from "@angular/router";
import { UserService } from "./services/user.service";

@Component({
  selector: "app-root",
  standalone: true,
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  imports: [MatToolbar, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  private readonly usr = inject(UserService);

  ngOnInit(): void {
    // load/apply user prefs
    this.usr.loadSettings();
  }
}
