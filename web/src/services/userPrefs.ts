import type { UserSettings } from "../types/chart.types";

/**
 * Persists theme / tooltip preferences in
 * localStorage and applies the theme class to `document.body`. Module-level
 * singleton.
 */
const STORAGE_KEY = "settings";
// Set only when the visitor flips the tooltip switch, so a stored default is not read as a choice.
const TOOLTIPS_CHOSEN_KEY = "settings.tooltipsChosen";
// Set when the visitor flips the theme switch, or when a stored light theme from before the system
// scheme was followed is migrated. A stored default is not read as a choice.
const THEME_CHOSEN_KEY = "settings.themeChosen";
// Set when the stored theme came from the system, so a stored light value is not read back as a choice.
const THEME_FOLLOWS_SYSTEM_KEY = "settings.themeFollowsSystem";
const isBrowser = typeof window !== "undefined";

const defaults: UserSettings = { isDarkTheme: true, showTooltips: false };

let current: UserSettings = { ...defaults };

/** Dark unless the system asks for light; dark also when the browser cannot say. */
function systemPrefersDark(): boolean {
  if (!isBrowser || typeof window.matchMedia !== "function") return true;
  try {
    return !window.matchMedia("(prefers-color-scheme: light)").matches;
  } catch {
    return true;
  }
}

export function getSettings(): UserSettings {
  return current;
}

export function loadSettings(): void {
  if (!isBrowser) {
    current = { ...defaults };
    return;
  }

  let cached: string | null = null;
  try {
    cached = localStorage.getItem(STORAGE_KEY);
  } catch {
    // localStorage may be unavailable; the defaults apply.
  }
  if (cached === null) {
    current = { ...defaults };
    followSystemTheme();
    applyTheme(current.isDarkTheme);
    cacheSettings();
    return;
  }

  try {
    current = JSON.parse(cached) as UserSettings;
  } catch {
    current = { ...defaults };
  }

  if (!tooltipsChosen()) current.showTooltips = defaults.showTooltips;

  if (!themeChosen()) {
    // Before the system scheme was followed the default was dark, so a stored light theme that
    // this code did not write can only be a choice.
    if (current.isDarkTheme === false && !themeFollowsSystem()) markThemeChosen();
    else followSystemTheme();
  }

  applyTheme(current.isDarkTheme);
  cacheSettings();
}

function followSystemTheme(): void {
  current.isDarkTheme = systemPrefersDark();
  try {
    localStorage.setItem(THEME_FOLLOWS_SYSTEM_KEY, "true");
  } catch {
    // localStorage may be unavailable.
  }
}

function themeFollowsSystem(): boolean {
  try {
    return localStorage.getItem(THEME_FOLLOWS_SYSTEM_KEY) === "true";
  } catch {
    return false;
  }
}

function themeChosen(): boolean {
  try {
    return localStorage.getItem(THEME_CHOSEN_KEY) === "true";
  } catch {
    return false;
  }
}

function markThemeChosen(): void {
  try {
    localStorage.setItem(THEME_CHOSEN_KEY, "true");
  } catch {
    // localStorage may be unavailable.
  }
}

function tooltipsChosen(): boolean {
  try {
    return localStorage.getItem(TOOLTIPS_CHOSEN_KEY) === "true";
  } catch {
    return false;
  }
}

export function changeTheme(isDarkTheme: boolean): void {
  markThemeChosen();
  applyTheme(isDarkTheme);
}

function applyTheme(isDarkTheme: boolean): void {
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

function cacheSettings(): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded).
  }
}
