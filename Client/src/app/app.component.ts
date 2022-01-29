import { Component, OnInit } from '@angular/core';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { StyleService } from './style.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  toggleColor = "warn";
  faGithub = faGithub;

  constructor(
    public readonly ts: StyleService
  ) { }

  ngOnInit(): void {
    this.ts.getTheme();
  }
}
