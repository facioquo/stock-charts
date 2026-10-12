import { describe, expect, it } from "vitest";

import { baseChartOptions, defaultXAxisOptions, isTooltipReading } from "./common";

const settings = { isDarkTheme: true, showTooltips: true };

describe("baseChartOptions", () => {
  it("lists every series at the hovered bar", () => {
    const options = baseChartOptions(settings);

    expect(options.interaction).toMatchObject({ mode: "index", intersect: false });
    expect(options.plugins?.tooltip).toMatchObject({ mode: "index", intersect: false });
  });
});

describe("defaultXAxisOptions", () => {
  it("titles a daily bar's tooltip with the date only", () => {
    const x = defaultXAxisOptions() as { time: { tooltipFormat: string } };

    expect(x.time.tooltipFormat).toBe("MMM d, yyyy");
  });
});

describe("isTooltipReading", () => {
  const item = (dataset: object) => ({ dataset });

  it("drops a dataset flagged skipTooltip and keeps a drawn series", () => {
    expect(isTooltipReading(item({ skipTooltip: true }))).toBe(false);
    expect(isTooltipReading(item({ label: "RSI(14)" }))).toBe(true);
  });

  it("is the filter every chart's tooltip uses", () => {
    expect(baseChartOptions(settings).plugins?.tooltip?.filter).toBe(isTooltipReading);
  });
});
