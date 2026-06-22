import type { CSSProperties } from "react";

import type { IndicatorResult } from "../../types/chart.types";

export interface LineWidthOption {
  name: string;
  value: number;
}

export interface LineTypeOption {
  name: string;
  value: string;
  /** Whether the user may specify a line width for this type. */
  userWidth: boolean;
}

/**
 * Material Design (M2) color palette used by the indicator style picker.
 * ref: https://m2.material.io/design/color/the-color-system.html
 */
export const presetColors: readonly string[] = [
  "#DD2C00", // deep orange A700 (red)
  "#EF6C00", // orange 800
  "#FDD835", // yellow 600
  "#C0CA33", // lime 600
  "#7CB342", // light green 600
  "#2E7D32", // green 800
  "#009688", // teal 500
  "#1E88E5", // blue 600
  "#1565C0", // blue 800
  "#3949AB", // indigo 600
  "#6A1B9A", // purple 800
  "#8E24AA", // purple 600
  "#EC407A", // pink 400
  "#616161", // gray 700 (dark)
  "#757575", // gray 600
  "#9E9E9E", // gray 500
  "#BDBDBD" // gray 400 (light)
];

export const lineWidths: readonly LineWidthOption[] = [
  { name: "thin", value: 1 },
  { name: "normal", value: 1.5 },
  { name: "thick", value: 2 },
  { name: "heavy", value: 3 }
];

export const lineTypes: readonly LineTypeOption[] = [
  { name: "solid", value: "solid", userWidth: true },
  { name: "dashes", value: "dash", userWidth: true },
  { name: "dots", value: "dots", userWidth: true },
  { name: "bar", value: "bar", userWidth: false },
  { name: "none", value: "none", userWidth: false }
];

/** Accepts 3-, 6-, or 8-digit hex colors (matches the original input pattern). */
export const HEX_COLOR_PATTERN = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8})$/;

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value);
}

/** Whether the given line-type value permits a user-specified width. */
export function userSpecifiedWidth(lineValue: string): boolean {
  return lineTypes.find(x => x.value === lineValue)?.userWidth ?? true;
}

/**
 * Inline style for the small line preview swatch next to each style control.
 * Ports `PickConfigComponent.getLineSample`.
 */
export function getLineSample(
  result: Pick<IndicatorResult, "color" | "lineType" | "lineWidth">
): CSSProperties {
  const style =
    result.lineType === "dots" ? "dotted" : result.lineType === "dash" ? "dashed" : "solid";

  const width = result.lineWidth * (style === "dotted" ? 2 : 1);

  return {
    borderBottomColor: result.color,
    borderBottomWidth: `${width}px`,
    borderBottomStyle: style
  };
}
