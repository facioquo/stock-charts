import { Injectable } from '@angular/core';

@Injectable()
export class StyleService {

  isDarkTheme = true;

  constructor(
  ) { }

  toggleTheme(isDark: boolean) {
    this.setTheme(isDark)
  }

  getTheme() {

    const isDark = localStorage.getItem("isDark");

    // if not cached, cache default value (above)
    if (isDark == undefined) {
      localStorage.setItem("isDark", this.isDarkTheme.valueOf().toString())
    }

    // otherwise, use value
    else {
      this.isDarkTheme = (isDark === "true") ? true : false;
    }

    this.setTheme(this.isDarkTheme);
  }

  setTheme(isDark: boolean){

    localStorage.setItem("isDark", isDark.valueOf().toString())

    document.body.setAttribute(
      'class',
      isDark ? 'dark-theme' : 'light-theme'
    );
  }
}

