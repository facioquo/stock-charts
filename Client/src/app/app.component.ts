import { Component, OnInit } from '@angular/core';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { StyleService } from './style.service';

import { PickListComponent } from './chart/picker/pick-list.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  faGithub = faGithub;

  constructor(
    public readonly ts: StyleService,
    private readonly bs: MatBottomSheet
  ) { }

  ngOnInit(): void {
    this.ts.getTheme();
  }

  // PICKERS
  openPickList(): void {
    const bsRef = this.bs.open(PickListComponent);
  }

}
