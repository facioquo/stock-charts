import { Injectable } from '@angular/core';

@Injectable()
export class UserConfigService {

  // default settings
  isDarkTheme: boolean = true;
  showCrosshairs: boolean = false;
  showTooltips: boolean = false;

  // storage names
  isDarkStorageName: string = "isDark";
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

    const isDark = localStorage.getItem(this.isDarkStorageName);

    // if not cached, set default (dark theme)
    if (isDark == undefined) {
      localStorage.setItem(this.isDarkStorageName, this.isDarkTheme.valueOf().toString())
    }

    // otherwise, use value
    else {
      this.isDarkTheme = (isDark === "true") ? true : false;
    }

    this.changeTheme(this.isDarkTheme);
  }

  changeTheme(isDark: boolean) {

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
    localStorage.setItem(this.isDarkStorageName, isDark.valueOf().toString())
  }

  initCrosshairs() {

    const showCrosshairs = localStorage.getItem(this.showCrosshairsStorageName);

    // if not cached, set default (off)
    if (showCrosshairs == undefined) {
      localStorage.setItem(this.showCrosshairsStorageName, this.showCrosshairs.valueOf().toString())
    }

    // otherwise, use value
    else {
      this.showCrosshairs = (showCrosshairs === "true") ? true : false;
    }

    this.changeCrosshairs(this.showCrosshairs);
  }

  changeCrosshairs(hasCrosshairs: boolean) {

    // value is picked up by chart service
    this.showCrosshairs = hasCrosshairs;

    // store new setting
    localStorage.setItem(this.showCrosshairsStorageName, hasCrosshairs.valueOf().toString())
  }

  initTooltips() {

    const showTooltips = localStorage.getItem(this.showTooltipsStorageName);

    // if not cached, set default (off)
    if (showTooltips == undefined) {
      localStorage.setItem(this.showTooltipsStorageName, this.showTooltips.valueOf().toString())
    }

    // otherwise, use value
    else {
      this.showTooltips = (showTooltips === "true") ? true : false;
    }

    this.changeTooltips(this.showTooltips);
  }

  changeTooltips(showTootlips: boolean) {

    // value is picked up by chart service
    this.showTooltips = showTootlips;

    // store new setting
    localStorage.setItem(this.showTooltipsStorageName, showTootlips.valueOf().toString())
  }
}
