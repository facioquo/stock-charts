import { Injectable } from '@angular/core';

interface Settings {
  isDarkTheme: boolean;
  showCrosshairs: boolean;
  showTooltips: boolean;
}

@Injectable()
export class UserConfigService {

  // default settings
  settings: Settings = {
    isDarkTheme: true,
    showCrosshairs: false,
    showTooltips: false
  };

  // storage names
  isDarkThemeStorageName: string = "isDarkTheme";
  showCrosshairsStorageName: string = "showCrosshairs";
  showTooltipsStorageName: string = "showTooltips";

  loadSettings() {
    this.initTheme();
    this.initCrosshairs();
    this.initTooltips();
  }

  // TODO: refactor these to be generic handlers
  // for defined settings codes, values, and storage names

  initTheme() {

    const isDarkTheme = localStorage.getItem(this.isDarkThemeStorageName);

    // if not cached, set default (dark theme)
    if (isDarkTheme == undefined) {
      localStorage.setItem(this.isDarkThemeStorageName, this.settings.isDarkTheme.valueOf().toString())
    }

    // otherwise, use value
    else {
      this.settings.isDarkTheme = (isDarkTheme === "true") ? true : false;
    }

    this.changeTheme(this.settings.isDarkTheme);
  }

  changeTheme(isDarkTheme: boolean) {

    // default site style is dark.
    // we override by adding the light theme CSS file in <head>
    // then remove it when going to dark, if it exists

    const refClassName = "theme-stylesheet";

    const lightElement = document.createElement('link');
    lightElement.setAttribute('rel', 'stylesheet');
    lightElement.classList.add(refClassName);

    // restore dark theme
    if (isDarkTheme) {
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
    localStorage.setItem(this.isDarkThemeStorageName, isDarkTheme.valueOf().toString())
  }

  initCrosshairs() {

    const showCrosshairs = localStorage.getItem(this.showCrosshairsStorageName);

    // if not cached, set default (off)
    if (showCrosshairs == undefined) {
      localStorage.setItem(this.showCrosshairsStorageName, this.settings.showCrosshairs.valueOf().toString())
    }

    // otherwise, use value
    else {
      this.settings.showCrosshairs = (showCrosshairs === "true") ? true : false;
    }

    this.changeCrosshairs(this.settings.showCrosshairs);
  }

  changeCrosshairs(hasCrosshairs: boolean) {

    // value is picked up by chart service
    this.settings.showCrosshairs = hasCrosshairs;

    // store new setting
    localStorage.setItem(this.showCrosshairsStorageName, hasCrosshairs.valueOf().toString())
  }

  initTooltips() {

    const showTooltips = localStorage.getItem(this.showTooltipsStorageName);

    // if not cached, set default (off)
    if (showTooltips == undefined) {
      localStorage.setItem(this.showTooltipsStorageName, this.settings.showTooltips.valueOf().toString())
    }

    // otherwise, use value
    else {
      this.settings.showTooltips = (showTooltips === "true") ? true : false;
    }

    this.changeTooltips(this.settings.showTooltips);
  }

  changeTooltips(showTootlips: boolean) {

    // value is picked up by chart service
    this.settings.showTooltips = showTootlips;

    // store new setting
    localStorage.setItem(this.showTooltipsStorageName, showTootlips.valueOf().toString())
  }
}
