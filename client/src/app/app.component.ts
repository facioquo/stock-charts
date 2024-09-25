import { Component, OnInit } from '@angular/core';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor(
    private readonly usr: UserService
  ) { }

  ngOnInit(): void {

    // load/apply user prefs
    this.usr.initSettings();
  }
}
