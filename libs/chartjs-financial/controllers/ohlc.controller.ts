/*
 * Derived from chartjs-chart-financial (https://github.com/chartjs/chartjs-chart-financial)
 * Version reference: upstream plugin v0.2.x API surface.
 * License: MIT.
 */

import { Chart } from "chart.js";
import { merge } from "chart.js/helpers";

import { OhlcElement } from "../elements/ohlc.element";
import { FinancialController } from "./financial.controller";

interface OhlcControllerInternals {
  _ruler?: unknown;
  getDataset: () => {
    label?: string;
    lineWidth?: number;
    armLength?: number | null;
    armLengthRatio?: number;
    color?: unknown;
  };
  resolveDataElementOptions: (index: number, mode: string) => unknown;
  getSharedOptions: (options: unknown) => unknown;
  updateSharedOptions: (sharedOptions: unknown, mode: string, firstOptions: unknown) => void;
  includeOptions: (mode: string, sharedOptions: unknown) => boolean;
  calculateElementProperties: (
    index: number,
    ruler: unknown,
    reset: boolean,
    options: unknown
  ) => unknown;
  updateElement: (element: unknown, index: number, properties: unknown, mode: string) => void;
}

export class OhlcController extends FinancialController {
  static id = "ohlc";

  static defaults = merge(
    {
      dataElementType: OhlcElement.id,
      datasets: {
        barPercentage: 1,
        categoryPercentage: 1
      }
    },
    (Chart.defaults as unknown as { financial: Record<string, unknown> }).financial
  );

  updateElements(elements: unknown[], start: number, count: number, mode: string): void {
    const controller = this as unknown as OhlcControllerInternals;
    const dataset = controller.getDataset();
    const ruler = controller._ruler ?? this._getRuler();
    const firstOptions = controller.resolveDataElementOptions(start, mode);
    const sharedOptions = controller.getSharedOptions(firstOptions);
    const includeOptions = controller.includeOptions(mode, sharedOptions);

    controller.updateSharedOptions(sharedOptions, mode, firstOptions);

    for (let i = 0; i < count; i++) {
      const dataIndex = start + i;
      const options = sharedOptions ?? controller.resolveDataElementOptions(dataIndex, mode);
      const baseProperties = controller.calculateElementProperties(
        dataIndex,
        ruler,
        mode === "reset",
        options
      );

      const properties = {
        ...(baseProperties as object),
        datasetLabel: dataset.label ?? "",
        lineWidth: dataset.lineWidth,
        armLength: dataset.armLength,
        armLengthRatio: dataset.armLengthRatio,
        color: dataset.color,
        ...(includeOptions ? { options } : {})
      };

      controller.updateElement(elements[dataIndex], dataIndex, properties, mode);
    }
  }
}
