import { Injectable } from '@angular/core';

@Injectable()
export class StyleService {

  isDarkTheme = true;

  constructor() { }

  toggleTheme(isDark: boolean) {
    this.setTheme(isDark);
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

  setTheme(isDark: boolean) {

    // default site style is dark.
    // we override by adding the light theme CSS file in <head>
    // then remove it when going to dark, if it exists

    const refClassName = "theme-stylesheet";

    const lightElement = document.createElement('link');
    lightElement.setAttribute('rel', 'stylesheet');
    lightElement.classList.add(refClassName);

    // restore dark theme
    if (isDark) {
      const linkExists = document.head.querySelector(`link[rel="stylesheet"].${refClassName}`)

      if (linkExists) {
        document.head.removeChild(linkExists);
      }
    }

    // add light theme
    else {
      lightElement.setAttribute('href', 'theme-light.css');
      document.head.appendChild(lightElement);
    }

    // store new setting
    localStorage.setItem("isDark", isDark.valueOf().toString())
  }
}

