import { Injectable } from '@angular/core';

@Injectable()
export class StyleService {

  isDarkTheme = true;

  constructor(
  ) { }

  toggleTheme(checked: boolean) {
    localStorage.setItem("isDark", checked.valueOf().toString())
  }

  getTheme() {

    const checked = localStorage.getItem("isDark");

    // if not cached, cache default value (above)
    if (checked == undefined) {
      localStorage.setItem("isDark", this.isDarkTheme.valueOf().toString())
    }

    // otherwise, use value
    else {
      this.isDarkTheme = (checked === "true") ? true : false;
    }
  }
}

