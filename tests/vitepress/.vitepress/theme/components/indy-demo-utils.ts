import type {
  IndicatorListing,
  IndicatorSelection
} from "@facioquo/indy-charts";

import {
  applySelectionTokens,
  createDefaultSelection
} from "@facioquo/indy-charts";

export { applySelectionTokens, createDefaultSelection };

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
