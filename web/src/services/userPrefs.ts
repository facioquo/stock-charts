import type { UserSettings } from "../types/chart.types";

/**
 * Persists theme / tooltip / series legend preferences in
 * localStorage and applies the theme class to `document.body`. Module-level
 * singleton.
 */
const STORAGE_KEY = "settings";
// Set only when the visitor flips the tooltip switch, so a stored default is not read as a choice.
const TOOLTIPS_CHOSEN_KEY = "settings.tooltipsChosen";
const isBrowser = typeof window !== "undefined";

const defaults: UserSettings = { isDarkTheme: true, showTooltips: false, showSeriesLegend: false };

let current: UserSettings = { ...defaults };

export function getSettings(): UserSettings {
  return current;
}

export function loadSettings(): void {
  if (!isBrowser) {
    current = { ...defaults };
    return;
  }

  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached === null) {
    current = { ...defaults };
    cacheSettings();
    return;
  }

  try {
    // Settings saved before a preference existed take its default.
    current = { ...defaults, ...(JSON.parse(cached) as Partial<UserSettings>) };
  } catch {
    current = { ...defaults };
  }

  if (!tooltipsChosen()) current.showTooltips = defaults.showTooltips;

  changeTheme(current.isDarkTheme);
  cacheSettings();
}

function tooltipsChosen(): boolean {
  try {
    return localStorage.getItem(TOOLTIPS_CHOSEN_KEY) === "true";
  } catch {
    return false;
  }
}

export function changeTheme(isDarkTheme: boolean): void {
  current.isDarkTheme = isDarkTheme;
  cacheSettings();

  if (!isBrowser) return;
  const themeClass = isDarkTheme ? "dark-theme" : "light-theme";
  document.body.classList.remove("dark-theme", "light-theme");
  document.body.classList.add(themeClass);
}

export function changeTooltips(showTooltips: boolean): void {
  current.showTooltips = showTooltips;
  cacheSettings();
  try {
    localStorage.setItem(TOOLTIPS_CHOSEN_KEY, "true");
  } catch {
    // localStorage may be unavailable.
  }
  // Actual tooltip add/remove is handled by the chart controller (theme update).
}

export function changeSeriesLegend(showSeriesLegend: boolean): void {
  current.showSeriesLegend = showSeriesLegend;
  cacheSettings();
  // The chart controller redraws the legends (theme update).
}

function cacheSettings(): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded).
  }
}
