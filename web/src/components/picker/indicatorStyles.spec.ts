import { describe, expect, it } from "vitest";

import {
  getLineSample,
  isValidHexColor,
  lineTypes,
  lineWidths,
  presetColors,
  userSpecifiedWidth
} from "./indicatorStyles";

describe("indicatorStyles", () => {
  describe("Material Design color palette", () => {
    it("includes all 17 preset colors", () => {
      expect(presetColors).toHaveLength(17);
    });

    it("uses valid 6-digit hex format", () => {
      presetColors.forEach(color => expect(color).toMatch(/^#[A-F0-9]{6}$/));
    });

    it("includes essential UI and grayscale colors", () => {
      ["#DD2C00", "#1E88E5", "#009688", "#6A1B9A", "#2E7D32"].forEach(c =>
        expect(presetColors).toContain(c)
      );
      ["#616161", "#9E9E9E", "#BDBDBD"].forEach(c => expect(presetColors).toContain(c));
    });
  });

  describe("line width configuration", () => {
    it("provides four standard widths with the expected values", () => {
      expect(lineWidths).toHaveLength(4);
      expect(lineWidths.find(w => w.name === "thin")?.value).toBe(1);
      expect(lineWidths.find(w => w.name === "normal")?.value).toBe(1.5);
      expect(lineWidths.find(w => w.name === "thick")?.value).toBe(2);
      expect(lineWidths.find(w => w.name === "heavy")?.value).toBe(3);
    });
  });

  describe("line type configuration", () => {
    it("provides all five line types", () => {
      expect(lineTypes.map(t => t.value)).toEqual(["solid", "dash", "dots", "bar", "none"]);
    });

    it("flags user-width control correctly", () => {
      expect(userSpecifiedWidth("solid")).toBe(true);
      expect(userSpecifiedWidth("dash")).toBe(true);
      expect(userSpecifiedWidth("dots")).toBe(true);
      expect(userSpecifiedWidth("bar")).toBe(false);
      expect(userSpecifiedWidth("none")).toBe(false);
    });
  });

  describe("getLineSample", () => {
    it("renders a solid line", () => {
      const style = getLineSample({ color: "#1E88E5", lineType: "solid", lineWidth: 1.5 });
      expect(style.borderBottomColor).toBe("#1E88E5");
      expect(style.borderBottomWidth).toBe("1.5px");
      expect(style.borderBottomStyle).toBe("solid");
    });

    it("renders a dashed line", () => {
      const style = getLineSample({ color: "#DD2C00", lineType: "dash", lineWidth: 2 });
      expect(style.borderBottomStyle).toBe("dashed");
      expect(style.borderBottomWidth).toBe("2px");
    });

    it("doubles the width for dotted lines", () => {
      const style = getLineSample({ color: "#009688", lineType: "dots", lineWidth: 1 });
      expect(style.borderBottomStyle).toBe("dotted");
      expect(style.borderBottomWidth).toBe("2px");
    });
  });

  describe("isValidHexColor", () => {
    it("accepts hex3, hex6, and hex8", () => {
      expect(isValidHexColor("#FFF")).toBe(true);
      expect(isValidHexColor("#FF0000")).toBe(true);
      expect(isValidHexColor("#FF0000FF")).toBe(true);
    });

    it("rejects malformed values", () => {
      expect(isValidHexColor("FF0000")).toBe(false);
      expect(isValidHexColor("#FF00")).toBe(false);
      expect(isValidHexColor("red")).toBe(false);
    });
  });
});
