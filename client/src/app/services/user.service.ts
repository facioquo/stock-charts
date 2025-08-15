import { Injectable } from "@angular/core";
import { UserSettings } from "../pages/chart/chart.models";

@Injectable({
  providedIn: "root"
})
export class UserService {
  settings: UserSettings; // initialized in app.component.ts

  loadSettings() {
    // load user preference settings from cache,
    // without applying changes to the UI

    // get from cache
    const settings = localStorage.getItem("settings");

    // if not cached, set default
    if (settings === null) {
      this.settings = {
        isDarkTheme: true,
        showTooltips: false
      };

      // store/cache new setting
      this.cacheSettings();
      return;
    }

    // otherwise, use cached values
    this.settings = JSON.parse(settings);

    // apply settings
    this.changeTheme(this.settings.isDarkTheme);
    this.changeTooltips(this.settings.showTooltips);
  }

  cacheSettings() {
    localStorage.setItem("settings", JSON.stringify(this.settings));
  }

  changeTheme(isDarkTheme: boolean) {
    // store/cache new setting
    this.settings.isDarkTheme = isDarkTheme;
    this.cacheSettings();

    // apply
    const themeClass = isDarkTheme ? "dark-theme" : "light-theme";

    document.body.classList.remove("dark-theme", "light-theme");
    document.body.classList.add(themeClass);
  }

  changeTooltips(showTooltips: boolean) {
    // store/cache new setting
    this.settings.showTooltips = showTooltips;
    this.cacheSettings();

    // note: actual add/remove of tooltips is done in chart service
  }
}
