import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "../../api/apiClient";
import type { ChartController } from "../../charting/chartController";
import type { IndicatorListing, IndicatorSelection } from "../../types/chart.types";

import { PickConfigDialog } from "./PickConfigDialog";

const listing: IndicatorListing = {
  name: "Relative Strength Index",
  uiid: "RSI",
  category: "oscillator",
  legendTemplate: "RSI",
  endpoint: "RSI/",
  chartType: "oscillator",
  order: 0,
  chartConfig: null,
  parameters: [],
  results: []
};

function defaultSelection(): IndicatorSelection {
  return {
    ucid: "chart-1",
    uiid: "RSI",
    label: "RSI",
    chartType: "oscillator",
    params: [
      {
        paramName: "lookbackPeriods",
        displayName: "Lookback Periods",
        minimum: 1,
        maximum: 250,
        value: 14
      }
    ],
    results: [
      {
        label: "RSI",
        displayName: "RSI",
        dataName: "rsi",
        color: "#1E88E5",
        lineType: "solid",
        lineWidth: 2,
        order: 0,
        dataset: { type: "line", data: [] }
      }
    ]
  };
}

interface FakeController {
  defaultSelection: ReturnType<typeof vi.fn>;
  addSelection: ReturnType<typeof vi.fn>;
}

function makeController(
  addSelection: FakeController["addSelection"] = vi.fn().mockResolvedValue(undefined)
): FakeController {
  return {
    defaultSelection: vi.fn(() => defaultSelection()),
    addSelection
  };
}

function renderDialog(controller: FakeController, onClose = vi.fn()): { onClose: typeof onClose } {
  render(
    <PickConfigDialog
      listing={listing}
      controller={controller as unknown as ChartController}
      onClose={onClose}
    />
  );
  return { onClose };
}

describe("PickConfigDialog", () => {
  it("renders the title and tabs with a valid default form", () => {
    renderDialog(makeController());
    expect(screen.getByRole("heading", { name: "Relative Strength Index" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Params" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Styles" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ADD" })).toBeEnabled();
  });

  it("disables submit and shows a range error for an out-of-range param", () => {
    renderDialog(makeController());
    fireEvent.change(screen.getByLabelText("Lookback Periods"), { target: { value: "999" } });
    expect(screen.getByText("Valid range is 1 to 250")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ADD" })).toBeDisabled();
  });

  it("adds the selection and closes on submit", async () => {
    const controller = makeController();
    const { onClose } = renderDialog(controller);

    fireEvent.click(screen.getByRole("button", { name: "ADD" }));

    await waitFor(() => expect(controller.addSelection).toHaveBeenCalledTimes(1));
    expect(controller.addSelection).toHaveBeenCalledWith(
      expect.objectContaining({ uiid: "RSI" }),
      listing
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("surfaces a server validation error and switches to RETRY", async () => {
    const controller = makeController(
      vi
        .fn()
        .mockRejectedValue(
          new ApiError("Request failed: 400", 400, "RSI/", "Lookback out of range")
        )
    );
    const { onClose } = renderDialog(controller);

    fireEvent.click(screen.getByRole("button", { name: "ADD" }));

    expect(await screen.findByText("Lookback out of range")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "RETRY" })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("switches to the styles tab and shows the result controls", () => {
    renderDialog(makeController());
    fireEvent.click(screen.getByRole("tab", { name: "Styles" }));
    expect(screen.getByLabelText("Line type")).toBeInTheDocument();
    expect(screen.getByLabelText("Line width")).toBeInTheDocument();
  });

  it("hides the styles tab for candle-only listings (e.g. Heikin-Ashi)", () => {
    // Candle series take colors from the themed candlestick element defaults,
    // so per-result style controls would be no-ops.
    const candleListing: IndicatorListing = {
      ...listing,
      name: "Heikin-Ashi",
      uiid: "HEIKIN-ASHI",
      category: "price-transform",
      results: [
        {
          displayName: "Heikin-Ashi",
          tooltipTemplate: "HEIKIN-ASHI",
          dataName: "close",
          dataType: "number",
          lineType: "candle",
          stack: "",
          lineWidth: 2,
          defaultColor: "#1E88E5"
        }
      ]
    };
    const controller = makeController();
    render(
      <PickConfigDialog
        listing={candleListing}
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByRole("tab", { name: "Styles" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ADD" })).toBeEnabled();
  });
});
