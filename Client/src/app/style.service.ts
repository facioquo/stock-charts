import { Injectable } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

@Injectable()
export class StyleService {

  constructor(
  ) { }

  isDarkTheme = true;

  onToggle(event: MatSlideToggleChange) {
    localStorage.setItem("isDark", event.checked.valueOf().toString())
  }

  getTheme() {
    const checked = localStorage.getItem("isDark");
    if (checked === undefined) {
      localStorage.setItem("isDark", this.isDarkTheme.valueOf().toString())
    }
    else {
      this.isDarkTheme = (checked === "true") ? true : false;
    }
  }
}

