import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ChartController } from "../../charting/chartController";
import type { IndicatorListing, IndicatorSelection } from "../../types/chart.types";

import { SettingsDialog } from "./SettingsDialog";

function makeSelection(ucid: string, label: string): IndicatorSelection {
  return {
    ucid,
    uiid: "RSI",
    label,
    chartType: "oscillator",
    params: [],
    results: []
  };
}

function makeListing(uiid: string, name: string, category: string): IndicatorListing {
  return {
    name,
    uiid,
    category,
    legendTemplate: name,
    endpoint: `${uiid}/`,
    chartType: "overlay",
    order: 0,
    chartConfig: null,
    parameters: [],
    results: []
  };
}

interface FakeController {
  selections: IndicatorSelection[];
  listings: IndicatorListing[];
  deleteSelection: ReturnType<typeof vi.fn>;
  onSettingsChange: ReturnType<typeof vi.fn>;
}

function makeController(): FakeController {
  const selections = [makeSelection("u1", "RSI (5)"), makeSelection("u2", "SMA (50)")];
  return {
    selections,
    listings: [
      makeListing("RSI", "Relative Strength Index", "oscillator"),
      makeListing("SMA", "Simple Moving Average", "moving-average")
    ],
    deleteSelection: vi.fn((ucid: string) => {
      const i = selections.findIndex(s => s.ucid === ucid);
      if (i >= 0) selections.splice(i, 1);
    }),
    onSettingsChange: vi.fn()
  };
}

afterEach(() => {
  document.body.className = "";
});

describe("SettingsDialog", () => {
  it("renders displayed and available indicators", () => {
    const controller = makeController();
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={vi.fn()}
      />
    );

    expect(screen.getByText("Chart settings")).toBeInTheDocument();
    expect(screen.getByText("RSI (5)")).toBeInTheDocument();
    expect(screen.getByText("Relative Strength Index")).toBeInTheDocument();
    expect(screen.getByText("Simple Moving Average")).toBeInTheDocument();
  });

  it("opens the config dialog for a chosen indicator", () => {
    const controller = makeController();
    const onPickIndicator = vi.fn();
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={onPickIndicator}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Simple Moving Average/ }));
    expect(onPickIndicator).toHaveBeenCalledWith(controller.listings[1]);
  });

  it("removes the checked displayed indicators", () => {
    const controller = makeController();
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={vi.fn()}
      />
    );

    const removeButton = screen.getByRole("button", { name: "REMOVE SELECTED" });
    expect(removeButton).toBeDisabled();

    // check the first displayed indicator, then remove
    const firstRow = screen.getByText("RSI (5)").closest("label") as HTMLElement;
    fireEvent.click(firstRow.querySelector('input[type="checkbox"]') as HTMLElement);
    expect(removeButton).toBeEnabled();

    fireEvent.click(removeButton);
    expect(controller.deleteSelection).toHaveBeenCalledWith("u1");
    expect(screen.queryByText("RSI (5)")).not.toBeInTheDocument();
  });

  it("toggles the dark theme and propagates the change to the chart", () => {
    const controller = makeController();
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText("Dark theme"));
    expect(controller.onSettingsChange).toHaveBeenCalled();
  });

  it("closes via the close button", () => {
    const controller = makeController();
    const onClose = vi.fn();
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={onClose}
        onPickIndicator={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "close" }));
    expect(onClose).toHaveBeenCalled();
  });
});
