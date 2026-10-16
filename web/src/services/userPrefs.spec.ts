import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { changeTheme, changeTooltips, getSettings, loadSettings } from "./userPrefs";

/**
 * Vitest tests for the module-level preference store: default/cached
 * settings, theme class application, and localStorage caching.
 */
describe("userPrefs", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.className = "";
  });

  afterEach(() => {
    localStorage.clear();
    document.body.className = "";
    vi.unstubAllGlobals();
  });

  const systemScheme = (scheme: "light" | "dark"): void => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === `(prefers-color-scheme: ${scheme})`
    }));
  };

  describe("loadSettings", () => {
    it("applies default settings when no cached settings exist", () => {
      loadSettings();

      expect(getSettings()).toEqual({ isDarkTheme: true, showTooltips: false });
      expect(localStorage.getItem("settings")).toBeTruthy();
    });

    it("loads cached settings when they exist", () => {
      const cached = { isDarkTheme: false, showTooltips: true };
      localStorage.setItem("settings", JSON.stringify(cached));
      localStorage.setItem("settings.tooltipsChosen", "true");

      loadSettings();

      expect(getSettings()).toEqual(cached);
    });

    it("turns tooltips off for a visitor whose stored value is only the old default", () => {
      localStorage.setItem("settings", JSON.stringify({ isDarkTheme: false, showTooltips: true }));

      loadSettings();

      expect(getSettings()).toEqual({ isDarkTheme: false, showTooltips: false });
    });

    it("keeps tooltips off for a visitor who chose off", () => {
      localStorage.setItem("settings", JSON.stringify({ isDarkTheme: false, showTooltips: false }));
      localStorage.setItem("settings.tooltipsChosen", "true");

      loadSettings();

      expect(getSettings().showTooltips).toBe(false);
    });

    it("keeps tooltips on for a visitor who switched them on", () => {
      loadSettings();
      changeTooltips(true);

      loadSettings();

      expect(getSettings().showTooltips).toBe(true);
    });

    it("applies the cached theme to document.body on load", () => {
      localStorage.setItem("settings", JSON.stringify({ isDarkTheme: false, showTooltips: true }));

      loadSettings();

      expect(document.body.classList.contains("light-theme")).toBe(true);
      expect(document.body.classList.contains("dark-theme")).toBe(false);
    });
  });

  describe("system color scheme", () => {
    it("follows a light system on a first visit", () => {
      systemScheme("light");

      loadSettings();

      expect(getSettings().isDarkTheme).toBe(false);
      expect(document.body.classList.contains("light-theme")).toBe(true);
    });

    it("follows a dark system on a first visit", () => {
      systemScheme("dark");

      loadSettings();

      expect(getSettings().isDarkTheme).toBe(true);
      expect(document.body.classList.contains("dark-theme")).toBe(true);
    });

    it("opens dark when the browser cannot report a scheme", () => {
      loadSettings();

      expect(getSettings().isDarkTheme).toBe(true);
    });

    it("follows the system for a visitor whose stored dark theme is only the old default", () => {
      systemScheme("light");
      localStorage.setItem("settings", JSON.stringify({ isDarkTheme: true, showTooltips: false }));

      loadSettings();

      expect(getSettings().isDarkTheme).toBe(false);
    });

    it("keeps a stored light theme on a dark system, since only a choice can have set it", () => {
      systemScheme("dark");
      localStorage.setItem("settings", JSON.stringify({ isDarkTheme: false, showTooltips: false }));

      loadSettings();
      loadSettings();

      expect(getSettings().isDarkTheme).toBe(false);
    });

    it("keeps a dark theme the visitor chose against a light system", () => {
      systemScheme("light");
      loadSettings();
      changeTheme(true);

      loadSettings();

      expect(getSettings().isDarkTheme).toBe(true);
      expect(document.body.classList.contains("dark-theme")).toBe(true);
    });
  });

  describe("changeTheme", () => {
    it("applies the dark theme", () => {
      changeTheme(true);

      expect(getSettings().isDarkTheme).toBe(true);
      expect(document.body.classList.contains("dark-theme")).toBe(true);
      expect(document.body.classList.contains("light-theme")).toBe(false);
    });

    it("applies the light theme", () => {
      changeTheme(false);

      expect(getSettings().isDarkTheme).toBe(false);
      expect(document.body.classList.contains("light-theme")).toBe(true);
      expect(document.body.classList.contains("dark-theme")).toBe(false);
    });

    it("removes the previous theme class when switching", () => {
      document.body.classList.add("dark-theme");

      changeTheme(false);

      expect(document.body.classList.contains("light-theme")).toBe(true);
      expect(document.body.classList.contains("dark-theme")).toBe(false);
    });

    it("caches settings after a theme change", () => {
      changeTheme(false);

      const cached = localStorage.getItem("settings");
      expect(cached).toBeTruthy();
      const parsed = JSON.parse(cached as string) as { isDarkTheme: boolean };
      expect(parsed.isDarkTheme).toBe(false);
    });
  });

  describe("changeTooltips", () => {
    it("updates the tooltip setting", () => {
      changeTooltips(true);

      expect(getSettings().showTooltips).toBe(true);
    });

    it("caches settings after a tooltip change", () => {
      changeTooltips(true);

      const cached = localStorage.getItem("settings");
      expect(cached).toBeTruthy();
      const parsed = JSON.parse(cached as string) as { showTooltips: boolean };
      expect(parsed.showTooltips).toBe(true);
    });
  });
});
