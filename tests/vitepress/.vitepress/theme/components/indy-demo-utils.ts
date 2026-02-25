import type { ChartDataset } from "chart.js";

import type {
  IndicatorListing,
  IndicatorParam,
  IndicatorParamConfig,
  IndicatorResult,
  IndicatorResultConfig,
  IndicatorSelection
} from "@facioquo/indy-charts";

let localCounter = 0;

function nextId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  localCounter += 1;
  return `vp-indicator-${Date.now()}-${localCounter}`;
}

export function createDefaultSelection(listing: IndicatorListing): IndicatorSelection {
  const selection = {
    ucid: nextId(),
    uiid: listing.uiid,
    label: listing.legendTemplate,
    chartType: listing.chartType,
    params: [],
    results: []
  } as IndicatorSelection;

  listing.parameters?.forEach((config: IndicatorParamConfig) => {
    const param = {
      paramName: config.paramName,
      displayName: config.displayName,
      minimum: config.minimum,
      maximum: config.maximum,
      value: config.defaultValue
    } as IndicatorParam;

    selection.params.push(param);
  });

  listing.results.forEach((config: IndicatorResultConfig) => {
    const result = {
      label: config.tooltipTemplate,
      color: config.defaultColor,
      dataName: config.dataName,
      displayName: config.displayName,
      lineType: config.lineType,
      lineWidth: typeof config.lineWidth === "number" ? config.lineWidth : 2,
      order: listing.order as number,
      // Runtime chart dataset is populated by ChartManager.processSelectionData()
      dataset: { type: "line", data: [] } as ChartDataset
    } as IndicatorResult;

    selection.results.push(result);
  });

  return selection;
}

export function applySelectionTokens(selection: IndicatorSelection): IndicatorSelection {
  selection.params.forEach((param, index) => {
    if (param.value == null) return;
    const token = `[P${index + 1}]`;
    const valueText = String(param.value);

    selection.label = selection.label.replace(token, valueText);
    selection.results.forEach(result => {
      result.label = result.label.replace(token, valueText);
    });
  });

  return selection;
}

export function setSelectionParams(
  selection: IndicatorSelection,
  values: Record<string, number>
): IndicatorSelection {
  selection.params.forEach(param => {
    const nextValue = values[param.paramName];
    if (typeof nextValue === "number") {
      param.value = nextValue;
    }
  });

  return selection;
}

export function requireListing(listings: IndicatorListing[], uiid: string): IndicatorListing {
  const listing = listings.find(item => item.uiid === uiid);
  if (!listing) {
    throw new Error(`Indicator listing not found for uiid "${uiid}"`);
  }

  return listing;
}
