import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { changeTheme, changeTooltips, getSettings, loadSettings } from "./userPrefs";

/**
 * Vitest parity port of the Angular `UserService` spec
 * (`client/src/app/services/user.service.spec.ts`). The Angular service used
 * `providedIn: "root"` DI + class methods; the React port is a module-level
 * singleton with free functions, so the assertions target the same behaviour
 * (default/cached settings, theme class application, localStorage caching)
 * against the functional API instead of an injected instance.
 */
describe("userPrefs", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.className = "";
  });

  afterEach(() => {
    localStorage.clear();
    document.body.className = "";
  });

  describe("loadSettings", () => {
    it("applies default settings when no cached settings exist", () => {
      loadSettings();

      expect(getSettings()).toEqual({ isDarkTheme: true, showTooltips: false });
      expect(localStorage.getItem("settings")).toBeTruthy();
    });

    it("loads cached settings when they exist", () => {
      const cached = { isDarkTheme: false, showTooltips: true };
      localStorage.setItem("settings", JSON.stringify(cached));

      loadSettings();

      expect(getSettings()).toEqual(cached);
    });

    it("applies the cached theme to document.body on load", () => {
      localStorage.setItem("settings", JSON.stringify({ isDarkTheme: false, showTooltips: true }));

      loadSettings();

      expect(document.body.classList.contains("light-theme")).toBe(true);
      expect(document.body.classList.contains("dark-theme")).toBe(false);
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
