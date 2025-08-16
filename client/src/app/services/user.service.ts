import { isPlatformBrowser } from "@angular/common";
import { Injectable, PLATFORM_ID, inject } from "@angular/core";
import { UserSettings } from "../pages/chart/chart.models";

@Injectable({
  providedIn: "root"
})
export class UserService {
  settings: UserSettings; // initialized in app.component.ts

  // platform detection for SSR safety
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  loadSettings() {
    // load user preference settings from cache,
    // without applying changes to the UI

    // During SSR, skip any browser API usage and just initialize defaults.
    if (!this.isBrowser) {
      this.settings = {
        isDarkTheme: true,
        showTooltips: false
      };
      return;
    }

    // get from cache
    const settings = this.isBrowser ? localStorage.getItem("settings") : null;

    // if not cached, set default
    if (settings === null) {
      this.settings = {
        isDarkTheme: true,
        showTooltips: false
      };

      // store/cache new setting
      this.cacheSettings(); // safe: guarded in cacheSettings
      return;
    }

    // otherwise, use cached values
    this.settings = JSON.parse(settings);

    // apply settings
    this.changeTheme(this.settings.isDarkTheme);
    this.changeTooltips(this.settings.showTooltips);
  }

  cacheSettings() {
    if (!this.isBrowser) return; // no-op on server
    localStorage.setItem("settings", JSON.stringify(this.settings));
  }

  changeTheme(isDarkTheme: boolean) {
    // store/cache new setting
    this.settings.isDarkTheme = isDarkTheme;
    this.cacheSettings();

    // apply
    if (!this.isBrowser) return; // skip DOM ops during SSR
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
