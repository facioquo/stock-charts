import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
  updateSelection: ReturnType<typeof vi.fn>;
}

function makeController(
  addSelection: FakeController["addSelection"] = vi.fn().mockResolvedValue(undefined)
): FakeController {
  return {
    defaultSelection: vi.fn(() => defaultSelection()),
    addSelection,
    updateSelection: vi.fn().mockResolvedValue(undefined)
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
  it("renders the title and view switch with a valid default form", () => {
    renderDialog(makeController());
    expect(screen.getByRole("heading", { name: "Relative Strength Index" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Params" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Styles" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeEnabled();
  });

  it("disables submit and shows a range error for an out-of-range param", () => {
    renderDialog(makeController());
    fireEvent.change(screen.getByLabelText("Lookback Periods"), { target: { value: "999" } });
    expect(screen.getByText("Valid range is 1 to 250")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
  });

  // Escape and a backdrop click reach the same Primer close request.
  describe("closing", () => {
    const pressEscape = (): void => {
      fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    };
    /** The confirmation Primer opens over the dialog. */
    const discardPrompt = async (): Promise<HTMLElement> => {
      const prompt = await screen.findByRole("alertdialog");
      expect(within(prompt).getByText("Discard changes?")).toBeInTheDocument();
      return prompt;
    };
    const answer = (prompt: HTMLElement, button: "Cancel" | "Discard"): void => {
      fireEvent.click(within(prompt).getByRole("button", { name: button }));
    };

    it("asks before discarding unsaved edits, and keeps them on cancel", async () => {
      const { onClose } = renderDialog(makeController());
      fireEvent.change(screen.getByLabelText("Lookback Periods"), { target: { value: "21" } });

      pressEscape();

      answer(await discardPrompt(), "Cancel");
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByLabelText("Lookback Periods")).toHaveValue(21);
    });

    it("closes once the discard is confirmed", async () => {
      const { onClose } = renderDialog(makeController());
      fireEvent.change(screen.getByLabelText("Lookback Periods"), { target: { value: "21" } });

      pressEscape();
      answer(await discardPrompt(), "Discard");

      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    });

    it("asks while a style edit is unsaved", async () => {
      const { onClose } = renderDialog(makeController());
      fireEvent.click(screen.getByRole("button", { name: "Styles" }));
      fireEvent.change(screen.getByLabelText("Line width"), { target: { value: "3" } });

      pressEscape();

      const prompt = await discardPrompt();
      expect(onClose).not.toHaveBeenCalled();
      answer(prompt, "Cancel");
    });

    it("asks while an edit of a displayed indicator is unsaved", async () => {
      const existing = { ...defaultSelection(), ucid: "displayed-1" };
      const onClose = vi.fn();
      render(
        <PickConfigDialog
          listing={listing}
          controller={makeController() as unknown as ChartController}
          selection={existing}
          onClose={onClose}
        />
      );
      fireEvent.click(screen.getByRole("button", { name: "Styles" }));
      fireEvent.change(screen.getByLabelText("Line type"), { target: { value: "dash" } });

      pressEscape();

      const prompt = await discardPrompt();
      expect(onClose).not.toHaveBeenCalled();
      answer(prompt, "Cancel");
    });

    it("asks from the close button too", async () => {
      const { onClose } = renderDialog(makeController());
      fireEvent.change(screen.getByLabelText("Lookback Periods"), { target: { value: "21" } });

      fireEvent.click(screen.getByRole("button", { name: "Close" }));

      const prompt = await discardPrompt();
      expect(onClose).not.toHaveBeenCalled();
      answer(prompt, "Cancel");
    });

    it("closes from Cancel without asking, since Cancel is the choice to leave", () => {
      const { onClose } = renderDialog(makeController());
      fireEvent.change(screen.getByLabelText("Lookback Periods"), { target: { value: "21" } });

      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes without asking when nothing was edited", () => {
      const { onClose } = renderDialog(makeController());

      pressEscape();

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes without asking once an edit is reverted", () => {
      const { onClose } = renderDialog(makeController());
      fireEvent.change(screen.getByLabelText("Lookback Periods"), { target: { value: "21" } });
      fireEvent.change(screen.getByLabelText("Lookback Periods"), { target: { value: "14" } });

      pressEscape();

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("adds the selection and closes on submit", async () => {
    const controller = makeController();
    const { onClose } = renderDialog(controller);

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(controller.addSelection).toHaveBeenCalledTimes(1));
    expect(controller.addSelection).toHaveBeenCalledWith(
      expect.objectContaining({ uiid: "RSI" }),
      listing
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("edits a displayed selection in place and saves it under the same ucid", async () => {
    const controller = makeController();
    const existing = { ...defaultSelection(), ucid: "displayed-1" };
    const onClose = vi.fn();
    render(
      <PickConfigDialog
        listing={listing}
        controller={controller as unknown as ChartController}
        selection={existing}
        onClose={onClose}
      />
    );

    expect(screen.getByLabelText("Lookback Periods")).toHaveValue(14);
    fireEvent.change(screen.getByLabelText("Lookback Periods"), { target: { value: "21" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(controller.updateSelection).toHaveBeenCalledTimes(1));
    expect(controller.updateSelection).toHaveBeenCalledWith(
      "displayed-1",
      expect.objectContaining({
        params: [expect.objectContaining({ paramName: "lookbackPeriods", value: 21 })]
      }),
      listing
    );
    expect(controller.addSelection).not.toHaveBeenCalled();
    expect(controller.defaultSelection).not.toHaveBeenCalled();
    // The displayed selection is edited as a copy, so it is not mutated.
    expect(existing.params[0]?.value).toBe(14);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("surfaces a server validation error and switches to Retry", async () => {
    const controller = makeController(
      vi
        .fn()
        .mockRejectedValue(
          new ApiError("Request failed: 400", 400, "RSI/", "Lookback out of range")
        )
    );
    const { onClose } = renderDialog(controller);

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText("Lookback out of range")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("switches to the styles view and shows the result controls", () => {
    renderDialog(makeController());
    fireEvent.click(screen.getByRole("button", { name: "Styles" }));
    expect(screen.getByLabelText("Line type")).toBeInTheDocument();
    expect(screen.getByLabelText("Line width")).toBeInTheDocument();
  });

  it("hides the styles view for candle-only listings (e.g. Heikin-Ashi)", () => {
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

    expect(screen.queryByRole("button", { name: "Styles" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeEnabled();
  });
});
