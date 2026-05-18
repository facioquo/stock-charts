import { FontSpec } from "chart.js";
import { AnnotationOptions, LabelAnnotationOptions, ScaleValue } from "chartjs-plugin-annotation";

import { ChartSettings } from "./types";
import { FONT_FAMILY } from "./common";
import { getThemeColors } from "./theme-colors";

export function commonLegendAnnotation(
  labelText: string,
  xPos: ScaleValue,
  yPos: ScaleValue,
  yAdj: number = 0,
  settings: ChartSettings
): AnnotationOptions & LabelAnnotationOptions {
  const themeColors = getThemeColors(settings);

  const legendFont: FontSpec = {
    family: FONT_FAMILY,
    size: 13,
    style: "normal",
    weight: "normal",
    lineHeight: 1
  };

  const annotation: AnnotationOptions & LabelAnnotationOptions = {
    id: "legend",
    type: "label",
    content: [labelText],
    textAlign: "start",
    font: legendFont,
    color: themeColors.text,
    backgroundColor: themeColors.background,
    padding: 0,
    position: "start",
    xScaleID: "x",
    yScaleID: "y",
    xValue: xPos,
    yValue: yPos,
    xAdjust: 0,
    yAdjust: yAdj
  };

  return annotation;
}
