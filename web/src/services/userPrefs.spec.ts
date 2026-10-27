import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  changeListingOrder,
  changeSeriesLegend,
  changeTheme,
  changeTooltips,
  getSettings,
  loadSettings
} from "./userPrefs";

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
  });

  describe("loadSettings", () => {
    it("applies default settings when no cached settings exist", () => {
      loadSettings();

      expect(getSettings()).toEqual({
        isDarkTheme: true,
        showTooltips: false,
        showSeriesLegend: false,
        listingOrder: "name"
      });
      expect(localStorage.getItem("settings")).toBeTruthy();
    });

    it("loads cached settings when they exist", () => {
      const cached = {
        isDarkTheme: false,
        showTooltips: true,
        showSeriesLegend: true,
        listingOrder: "name"
      };
      localStorage.setItem("settings", JSON.stringify(cached));
      localStorage.setItem("settings.tooltipsChosen", "true");

      loadSettings();

      expect(getSettings()).toEqual(cached);
    });

    it("turns tooltips off for a visitor whose stored value is only the old default", () => {
      localStorage.setItem("settings", JSON.stringify({ isDarkTheme: false, showTooltips: true }));

      loadSettings();

      expect(getSettings()).toEqual({
        isDarkTheme: false,
        showTooltips: false,
        showSeriesLegend: false,
        listingOrder: "name"
      });
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

    it("leaves the series legend off for a visitor whose settings predate it", () => {
      localStorage.setItem("settings", JSON.stringify({ isDarkTheme: false, showTooltips: false }));

      loadSettings();

      expect(getSettings().showSeriesLegend).toBe(false);
    });

    it("keeps the series legend on for a visitor who switched it on", () => {
      loadSettings();
      changeSeriesLegend(true);

      loadSettings();

      expect(getSettings().showSeriesLegend).toBe(true);
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

  describe("changeSeriesLegend", () => {
    it("updates and caches the series legend setting", () => {
      changeSeriesLegend(true);

      expect(getSettings().showSeriesLegend).toBe(true);
      const parsed = JSON.parse(localStorage.getItem("settings") as string) as {
        showSeriesLegend: boolean;
      };
      expect(parsed.showSeriesLegend).toBe(true);
    });
  });

  describe("changeListingOrder", () => {
    it("updates and caches the listing order", () => {
      changeListingOrder("name");

      expect(getSettings().listingOrder).toBe("name");
      const parsed = JSON.parse(localStorage.getItem("settings") as string) as {
        listingOrder: string;
      };
      expect(parsed.listingOrder).toBe("name");
    });

    // An array or object that stringifies to a known order must not pass, or throw.
    it.each([["newest"], [["name"]], [{ toString: "x" }]])(
      "lists A to Z when the stored order is %j",
      listingOrder => {
        localStorage.setItem("settings", JSON.stringify({ listingOrder }));

        loadSettings();

        expect(getSettings().listingOrder).toBe("name");
      }
    );

    it("keeps a visitor's choice to group by category", () => {
      localStorage.setItem("settings", JSON.stringify({ listingOrder: "category" }));

      loadSettings();

      expect(getSettings().listingOrder).toBe("category");
    });
  });
});
