import { useSyncExternalStore } from "react";

import { ChartController, type ChartState } from "./chartController";

/**
 * Lazily-constructed singleton ChartController, mirroring Angular's root-provided
 * `ChartService`. Constructed on first use (after `setupIndyCharts()` runs in
 * `main.tsx`) rather than at module load.
 */
let instance: ChartController | undefined;

export function getChartController(): ChartController {
  if (!instance) instance = new ChartController();
  return instance;
}

/** Subscribe a component to the controller's `loading` / `apiError` state. */
export function useChartState(): ChartState {
  const controller = getChartController();
  return useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
}
