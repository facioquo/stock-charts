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
  moveSelection: ReturnType<typeof vi.fn>;
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
    moveSelection: vi.fn((ucid: string, offset: -1 | 1) => {
      const from = selections.findIndex(s => s.ucid === ucid);
      const to = selections.findIndex(
        (s, i) => i !== from && i === from + offset && s.chartType === selections[from]?.chartType
      );
      if (from >= 0 && to >= 0)
        [selections[from], selections[to]] = [selections[to], selections[from]];
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
        onEditIndicator={vi.fn()}
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
        onEditIndicator={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Simple Moving Average/ }));
    expect(onPickIndicator).toHaveBeenCalledWith(controller.listings[1]);
  });

  it("opens the config dialog to edit a displayed indicator", () => {
    const controller = makeController();
    const onEditIndicator = vi.fn();
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={vi.fn()}
        onEditIndicator={onEditIndicator}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "edit RSI (5)" }));
    expect(onEditIndicator).toHaveBeenCalledWith(controller.selections[0]);
  });

  it("groups indicators by chart and reorders within a group", () => {
    const controller = makeController();
    controller.selections.push({
      ...makeSelection("u3", "EMA (20)"),
      chartType: "overlay"
    });
    controller.selections.push(makeSelection("u4", "ADX (14)"));
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={vi.fn()}
        onEditIndicator={vi.fn()}
      />
    );

    expect(screen.getByText("Price chart overlays")).toBeInTheDocument();
    expect(screen.getByText("Oscillator charts")).toBeInTheDocument();

    // Each group's first row cannot move up and its last cannot move down.
    expect(screen.getByRole("button", { name: "move EMA (20) up" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "move EMA (20) down" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "move RSI (5) up" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "move ADX (14) down" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "move SMA (50) up" }));
    expect(controller.moveSelection).toHaveBeenCalledWith("u2", -1);
  });

  it("keeps keyboard focus on the moved row's button after a move", () => {
    const controller = makeController();
    controller.selections.push(makeSelection("u3", "ADX (14)"));
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={vi.fn()}
        onEditIndicator={vi.fn()}
      />
    );

    // A move that does not reach the end of the group keeps the same button.
    fireEvent.click(screen.getByRole("button", { name: "move RSI (5) down" }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "move RSI (5) down" }));

    // A move onto the end disables the pressed button; focus goes to the opposite one.
    fireEvent.click(screen.getByRole("button", { name: "move RSI (5) down" }));
    expect(screen.getByRole("button", { name: "move RSI (5) down" })).toBeDisabled();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "move RSI (5) up" }));
  });

  it("removes the checked displayed indicators", () => {
    const controller = makeController();
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={vi.fn()}
        onEditIndicator={vi.fn()}
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
        onEditIndicator={vi.fn()}
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
        onEditIndicator={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "close" }));
    expect(onClose).toHaveBeenCalled();
  });
});
