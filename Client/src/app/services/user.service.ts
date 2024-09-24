import { Injectable } from '@angular/core';
import { UserSettings } from '../chart/chart.models';

@Injectable()
export class UserService {

  settings: UserSettings; // initialized in app.component.ts

  initSettings() {

    // load user preference settings from cache,
    // without applying changes to the UI

    // get from cache
    const settings = localStorage.getItem("settings");

    // if not cached, set default
    if (settings == undefined) {

      this.settings = {
        isDarkTheme: true,
        showCrosshairs: false,
        showTooltips: false
      }

      // store/cache new setting
      this.cacheSettings();
      return;
    }

    // otherwise, use cached values
    this.settings = JSON.parse(settings);

    // apply settings
    this.changeTheme(this.settings.isDarkTheme);
    this.changeCrosshairs(this.settings.showCrosshairs);
    this.changeTooltips(this.settings.showTooltips);
  }

  cacheSettings() {
    localStorage.setItem("settings", JSON.stringify(this.settings));
  }

  changeTheme(isDarkTheme: boolean) {

    // default site style is dark.
    // we override by adding the light theme CSS file in <head>
    // then remove it when going to dark, if it exists

    // store/cache new setting
    this.settings.isDarkTheme = isDarkTheme;
    this.cacheSettings();

    // add/remove theme stylesheet
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
  }

  changeCrosshairs(showCrosshairs: boolean) {

    // store/cache new setting
    this.settings.showCrosshairs = showCrosshairs;
    this.cacheSettings();

    // note: actual add/remove of crosshairs is done in chart service
  }

  changeTooltips(showTooltips: boolean) {

    // store/cache new setting
    this.settings.showTooltips = showTooltips;
    this.cacheSettings();

    // note: actual add/remove of tooltips is done in chart service
  }
}
