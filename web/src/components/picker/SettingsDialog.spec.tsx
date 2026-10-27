import { createEvent, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ChartController } from "../../charting/chartController";
import {
  changeListingOrder,
  changeSeriesLegend,
  changeTooltips,
  getSettings
} from "../../services/userPrefs";
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
  addSelection: ReturnType<typeof vi.fn>;
  moveSelection: ReturnType<typeof vi.fn>;
  applyOrder: ReturnType<typeof vi.fn>;
  onSettingsChange: ReturnType<typeof vi.fn>;
  shareUrl: ReturnType<typeof vi.fn>;
}

function makeController(): FakeController {
  const selections = [makeSelection("u1", "RSI (5)"), makeSelection("u2", "SMA (50)")];
  return {
    selections,
    listings: [
      makeListing("RSI", "Relative Strength Index", "oscillator"),
      makeListing("SMA", "Simple Moving Average", "moving-average")
    ],
    addSelection: vi.fn().mockResolvedValue(undefined),
    deleteSelection: vi.fn((ucid: string) => {
      const i = selections.findIndex(s => s.ucid === ucid);
      if (i >= 0) selections.splice(i, 1);
    }),
    moveSelection: vi.fn((ucid: string, offset: -1 | 1) => {
      const moved = selections.find(s => s.ucid === ucid);
      if (!moved) return;
      const group = selections.filter(s => s.chartType === moved.chartType);
      const target = group.at(group.indexOf(moved) + offset);
      if (!target || group.indexOf(moved) + offset < 0) return;
      const from = selections.indexOf(moved);
      const to = selections.indexOf(target);
      selections.splice(from, 1);
      selections.splice(to, 0, moved);
    }),
    applyOrder: vi.fn(),
    onSettingsChange: vi.fn(),
    shareUrl: vi.fn(() => "https://charts.example/?c=1.abc")
  };
}

/** Primer's Banner renders its action once per responsive layout; jsdom shows both. */
function clickUndo(): void {
  const undo = screen.getAllByRole("button", { name: "Undo" }).at(0);
  if (!undo) throw new Error("no Undo button");
  fireEvent.click(undo);
}

afterEach(() => {
  changeSeriesLegend(false);
  changeListingOrder("name");
  changeTooltips(false);
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
    expect(screen.getByText("Moving averages")).toBeInTheDocument();
    expect(screen.getByText("Oscillators")).toBeInTheDocument();
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

    expect(screen.getByRole("button", { name: "reorder EMA (20)" })).toHaveAttribute(
      "draggable",
      "true"
    );
    const oscillatorList = screen.getByRole("list", { name: "Oscillator charts" });
    const reorderHandle = screen.getByRole("button", { name: "reorder RSI (5)" });
    fireEvent.keyDown(reorderHandle, { key: "ArrowDown" });
    expect(controller.moveSelection).toHaveBeenCalledWith("u1", 1);
    expect(document.activeElement).toBe(reorderHandle);
    expect(
      within(oscillatorList)
        .getAllByRole("checkbox")
        .map(checkbox => checkbox.getAttribute("aria-label"))
    ).toEqual(["select SMA (50)", "select RSI (5)", "select ADX (14)"]);

    fireEvent.keyDown(reorderHandle, { key: "ArrowUp" });
    expect(controller.moveSelection).toHaveBeenLastCalledWith("u1", -1);
    expect(screen.getByText("RSI (5) moved to 1 of 3")).toHaveAttribute("role", "status");
  });

  it("leaves a row at either end of its group where it is, and says nothing", () => {
    const controller = makeController();
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={vi.fn()}
        onEditIndicator={vi.fn()}
      />
    );

    fireEvent.keyDown(screen.getByRole("button", { name: "reorder RSI (5)" }), { key: "ArrowUp" });
    fireEvent.keyDown(screen.getByRole("button", { name: "reorder SMA (50)" }), {
      key: "ArrowDown"
    });

    expect(controller.moveSelection).not.toHaveBeenCalled();
    expect(screen.queryByText(/moved to/)).toBeNull();
  });

  it("moves a row from its handle's menu, for a pointer that cannot drag", async () => {
    const controller = makeController();
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={vi.fn()}
        onEditIndicator={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "reorder RSI (5)" }));
    expect(await screen.findByRole("menuitem", { name: "Move up" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Move down" }));

    expect(controller.moveSelection).toHaveBeenCalledWith("u1", 1);
    expect(screen.getByText("RSI (5) moved to 2 of 2")).toHaveAttribute("role", "status");
  });

  it("reorders displayed indicators by dragging within their chart group", () => {
    const controller = makeController();
    controller.selections.push(makeSelection("u3", "ADX (14)"));
    controller.selections.push(makeSelection("u4", "MACD (12,26,9)"));
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={vi.fn()}
        onEditIndicator={vi.fn()}
      />
    );

    const dataTransfer = {
      effectAllowed: "none",
      dropEffect: "none",
      getData: vi.fn(() => "u1"),
      setData: vi.fn()
    } as unknown as DataTransfer;
    const rowOf = (label: string): HTMLElement => {
      const row = screen.getByText(label).closest("li");
      expect(row).not.toBeNull();
      // Every row spans y 0-40 in these tests, so its midpoint is y 20.
      vi.spyOn(row as HTMLElement, "getBoundingClientRect").mockReturnValue(
        new DOMRect(0, 0, 200, 40)
      );
      return row as HTMLElement;
    };
    // jsdom has no DragEvent, so the pointer position is set on the event by hand.
    const dragOver = (row: HTMLElement, clientY: number): boolean => {
      const event = createEvent.dragOver(row, { dataTransfer });
      Object.defineProperty(event, "clientY", { value: clientY });
      return fireEvent(row, event);
    };
    const handle = screen.getByRole("button", { name: "reorder RSI (5)" });
    const dragged = rowOf("RSI (5)");
    const neighbor = rowOf("SMA (50)");
    const target = rowOf("MACD (12,26,9)");

    fireEvent.dragStart(handle, { dataTransfer });

    // The gaps on either side of the dragged row would not move it, so neither is marked.
    expect(dragOver(dragged, 30)).toBe(true);
    expect(dragOver(neighbor, 10)).toBe(true);
    expect(document.querySelector(".drop-before, .drop-after")).toBeNull();

    // The insertion line marks the gap between rows, not the row under the pointer.
    dragOver(target, 10);
    expect(target).toHaveClass("drop-before");
    dragOver(target, 30);
    expect(target).toHaveClass("drop-after");
    expect(target).not.toHaveClass("drop-before");

    fireEvent.drop(target, { dataTransfer });
    fireEvent.dragEnd(handle, { dataTransfer });
    expect(document.querySelector(".drop-before, .drop-after")).toBeNull();

    expect(controller.moveSelection).toHaveBeenNthCalledWith(1, "u1", 1);
    expect(controller.moveSelection).toHaveBeenCalledTimes(3);
    expect(controller.moveSelection).toHaveBeenNthCalledWith(2, "u1", 1);
    expect(controller.moveSelection).toHaveBeenNthCalledWith(3, "u1", 1);
    expect(
      within(screen.getByRole("list", { name: "Oscillator charts" }))
        .getAllByRole("checkbox")
        .map(checkbox => checkbox.getAttribute("aria-label"))
    ).toEqual(["select SMA (50)", "select ADX (14)", "select MACD (12,26,9)", "select RSI (5)"]);
  });

  describe("touch drag", () => {
    /** Lays the oscillator rows out 40px tall from the top, as jsdom draws nothing. */
    function layOutRows(): void {
      const rows = within(screen.getByRole("list", { name: "Oscillator charts" })).getAllByRole(
        "listitem"
      );
      rows.forEach((row, i) => {
        vi.spyOn(row, "getBoundingClientRect").mockReturnValue(
          DOMRect.fromRect({ x: 0, y: i * 40, width: 300, height: 40 })
        );
      });
    }

    function renderTwo(): FakeController {
      const controller = makeController();
      render(
        <SettingsDialog
          controller={controller as unknown as ChartController}
          onClose={vi.fn()}
          onPickIndicator={vi.fn()}
          onEditIndicator={vi.fn()}
        />
      );
      layOutRows();
      return controller;
    }

    it("moves a row dragged by finger into the gap it is released over", () => {
      const controller = renderTwo();
      const handle = screen.getByRole("button", { name: "reorder SMA (50)" });

      fireEvent.pointerDown(handle, { pointerType: "touch", pointerId: 1, clientY: 60 });
      fireEvent.pointerMove(handle, { pointerType: "touch", pointerId: 1, clientY: 40 });
      fireEvent.pointerMove(handle, { pointerType: "touch", pointerId: 1, clientY: 5 });
      expect(handle.closest("li")).toHaveClass("dragging");
      fireEvent.pointerUp(handle, { pointerType: "touch", pointerId: 1, clientY: 5 });
      fireEvent.click(handle);

      expect(controller.moveSelection).toHaveBeenCalledWith("u2", -1);
      // The click that ends a drag does not also open the move menu.
      expect(screen.queryByRole("menu")).toBeNull();
    });

    it("treats a touch that barely moves as a tap", () => {
      const controller = renderTwo();
      const handle = screen.getByRole("button", { name: "reorder SMA (50)" });

      fireEvent.pointerDown(handle, { pointerType: "touch", pointerId: 1, clientY: 60 });
      fireEvent.pointerMove(handle, { pointerType: "touch", pointerId: 1, clientY: 63 });
      fireEvent.pointerUp(handle, { pointerType: "touch", pointerId: 1, clientY: 63 });

      expect(handle.closest("li")).not.toHaveClass("dragging");
      expect(controller.moveSelection).not.toHaveBeenCalled();
    });

    it("leaves a mouse drag running when its pointer is cancelled", () => {
      renderTwo();
      const handle = screen.getByRole("button", { name: "reorder SMA (50)" });
      const dataTransfer = { effectAllowed: "none", setData: vi.fn() };

      fireEvent.pointerDown(handle, { pointerType: "mouse", pointerId: 1 });
      fireEvent.dragStart(handle, { dataTransfer });
      // Chrome cancels the mouse pointer once HTML drag and drop takes over.
      fireEvent.pointerCancel(handle, { pointerType: "mouse", pointerId: 1 });

      expect(handle.closest("li")).toHaveClass("dragging");
    });
  });

  it("does not allow a drag to reorder across chart groups", () => {
    const controller = makeController();
    controller.selections.push({ ...makeSelection("u3", "EMA (20)"), chartType: "overlay" });
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={vi.fn()}
        onEditIndicator={vi.fn()}
      />
    );

    const dataTransfer = {
      effectAllowed: "none",
      dropEffect: "none",
      getData: vi.fn(() => "u1"),
      setData: vi.fn()
    } as unknown as DataTransfer;
    fireEvent.dragStart(screen.getByRole("button", { name: "reorder RSI (5)" }), {
      dataTransfer
    });
    const overlayTarget = screen.getByText("EMA (20)").closest("li");
    expect(overlayTarget).not.toBeNull();
    // An unprevented dragover tells the browser the row is not a drop target.
    expect(fireEvent.dragOver(overlayTarget as HTMLElement, { dataTransfer })).toBe(true);
    expect(overlayTarget).not.toHaveClass("drop-before");
    expect(overlayTarget).not.toHaveClass("drop-after");
    fireEvent.drop(overlayTarget as HTMLElement, { dataTransfer });

    expect(controller.moveSelection).not.toHaveBeenCalled();
  });

  it("checks a displayed indicator from its label, with the checkbox last in the row", () => {
    const controller = makeController();
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={vi.fn()}
        onEditIndicator={vi.fn()}
      />
    );

    const label = screen.getByText("RSI (5)");
    fireEvent.click(label);
    const checkbox = screen.getByRole("checkbox", { name: "select RSI (5)" });
    expect(checkbox).toBeChecked();
    expect(label).toHaveAttribute("for", checkbox.id);
    // The drag handle leads the row; the checkbox is a direct child, after the label and buttons.
    const row = checkbox.closest("li");
    expect(checkbox.parentElement).toBe(row);
    expect(row?.firstElementChild).toBe(screen.getByRole("button", { name: "reorder RSI (5)" }));
    expect(row?.lastElementChild).toBe(checkbox);
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

    const removeButton = screen.getByRole("button", { name: /^Remove selected/ });
    expect(removeButton).toBeDisabled();

    // check the first displayed indicator, then remove
    fireEvent.click(screen.getByRole("checkbox", { name: "select RSI (5)" }));
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

    fireEvent.click(screen.getByRole("button", { name: "Dark theme" }));
    expect(controller.onSettingsChange).toHaveBeenCalled();
  });

  it("toggles a setting when its label text is clicked", () => {
    const controller = makeController();
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={vi.fn()}
        onEditIndicator={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Show tooltips"));

    expect(screen.getByRole("button", { name: "Show tooltips" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("names each switch from the text of its row", () => {
    const controller = makeController();
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={vi.fn()}
        onEditIndicator={vi.fn()}
      />
    );

    const toggle = screen.getByRole("button", { name: "Show tooltips" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("switches the series legend on and off, redrawing the charts each time", () => {
    const controller = makeController();
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={vi.fn()}
        onEditIndicator={vi.fn()}
      />
    );

    const toggle = screen.getByRole("button", { name: "Show series legend" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(getSettings().showSeriesLegend).toBe(true);

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(getSettings().showSeriesLegend).toBe(false);
    expect(controller.onSettingsChange).toHaveBeenCalledTimes(2);
  });

  it("starts with the series legend switch on when the visitor saved it on", () => {
    changeSeriesLegend(true);
    render(
      <SettingsDialog
        controller={makeController() as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={vi.fn()}
        onEditIndicator={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Show series legend" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
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

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });

  describe("copy link", () => {
    function renderDialog(controller: FakeController): void {
      render(
        <SettingsDialog
          controller={controller as unknown as ChartController}
          onClose={vi.fn()}
          onPickIndicator={vi.fn()}
          onEditIndicator={vi.fn()}
        />
      );
    }

    it("copies the share link and says so", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });
      renderDialog(makeController());

      fireEvent.click(screen.getByRole("button", { name: "copy share link" }));

      expect(writeText).toHaveBeenCalledWith("https://charts.example/?c=1.abc");
      await waitFor(() => {
        expect(screen.getByText("Link copied")).toHaveAttribute("role", "status");
      });
    });

    it("reports a clipboard that refuses the write", async () => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) }
      });
      renderDialog(makeController());

      fireEvent.click(screen.getByRole("button", { name: "copy share link" }));

      await waitFor(() => {
        expect(screen.getByText("Copy failed")).toHaveAttribute("role", "status");
      });
    });

    it("reports a failure when the clipboard is unavailable", () => {
      Object.assign(navigator, { clipboard: undefined });
      renderDialog(makeController());

      fireEvent.click(screen.getByRole("button", { name: "copy share link" }));

      expect(screen.getByText("Copy failed")).toHaveAttribute("role", "status");
    });

    it("is not offered with nothing displayed", () => {
      const controller = makeController();
      controller.selections.length = 0;
      renderDialog(controller);

      expect(screen.queryByRole("button", { name: "copy share link" })).not.toBeInTheDocument();
    });
  });

  it("reports a removal with the count and lets it be undone", async () => {
    const controller = makeController();
    controller.selections[0] = { ...controller.selections[0], uiid: "RSI" };
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={vi.fn()}
        onEditIndicator={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "select RSI (5)" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove selected(1)" }));

    expect(screen.getByText("Removed RSI (5)")).toBeInTheDocument();

    clickUndo();
    expect(controller.addSelection).toHaveBeenCalledWith(
      expect.objectContaining({ ucid: "u1" }),
      controller.listings[0]
    );
    expect(screen.queryAllByRole("button", { name: "Undo" })).toHaveLength(0);
    expect(await screen.findByText("Restored RSI (5)")).toBeInTheDocument();
    expect(controller.addSelection).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Removed RSI (5)")).not.toBeInTheDocument();
  });

  it("puts a restored indicator back at its removed position", async () => {
    const controller = makeController();
    controller.selections[0] = { ...controller.selections[0], uiid: "RSI" };
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={vi.fn()}
        onEditIndicator={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "select RSI (5)" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove selected(1)" }));
    clickUndo();

    await screen.findByText("Restored RSI (5)");
    expect(controller.applyOrder).toHaveBeenCalledWith(["u1", "u2"]);
    expect(controller.applyOrder.mock.invocationCallOrder[0]).toBeGreaterThan(
      controller.addSelection.mock.invocationCallOrder[0] ?? Infinity
    );
  });

  it("keeps a reorder made between the removal and the undo", async () => {
    const controller = makeController();
    const sel = controller.selections;
    sel.push(makeSelection("u3", "EMA (20)"));
    sel[0] = { ...sel[0], uiid: "RSI" };
    // Adding appends, as the real controller does.
    controller.addSelection = vi.fn((selection: IndicatorSelection) => {
      sel.push(selection);
      return Promise.resolve();
    });
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={vi.fn()}
        onEditIndicator={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "select RSI (5)" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove selected(1)" }));
    // u3 moves above u2 after the removal: u3, u2.
    sel.splice(0, sel.length, ...[sel[1], sel[0]].filter(Boolean));
    clickUndo();

    await screen.findByText("Restored RSI (5)");
    expect(controller.applyOrder).toHaveBeenCalledWith(["u3", "u1", "u2"]);
  });

  describe("restoring several removed indicators", () => {
    function renderThree(): FakeController {
      const controller = makeController();
      const sel = controller.selections;
      sel.push(makeSelection("u3", "EMA (20)"));
      // Adding appends, as the real controller does.
      controller.addSelection = vi.fn((selection: IndicatorSelection) => {
        sel.push(selection);
        return Promise.resolve();
      });
      render(
        <SettingsDialog
          controller={controller as unknown as ChartController}
          onClose={vi.fn()}
          onPickIndicator={vi.fn()}
          onEditIndicator={vi.fn()}
        />
      );
      fireEvent.click(screen.getByRole("checkbox", { name: "select RSI (5)" }));
      fireEvent.click(screen.getByRole("checkbox", { name: "select SMA (50)" }));
      fireEvent.click(screen.getByRole("button", { name: "Remove selected(2)" }));
      return controller;
    }

    it("puts two adjacent removals back in their old order", async () => {
      const controller = renderThree();

      clickUndo();

      await screen.findByText("Restored 2 indicators");
      expect(controller.applyOrder).toHaveBeenCalledWith(["u1", "u2", "u3"]);
    });

    it("orders the rest around the one that came back when the other fails", async () => {
      const controller = renderThree();
      const sel = controller.selections;
      controller.addSelection = vi
        .fn()
        .mockImplementationOnce((selection: IndicatorSelection) => {
          sel.push(selection);
          return Promise.resolve();
        })
        .mockRejectedValueOnce(new Error("gone"));

      clickUndo();

      await screen.findByText("Restored 1 of 2 indicators");
      expect(screen.getByRole("region", { name: "Indicator restore problem" })).toHaveAttribute(
        "data-variant",
        "warning"
      );
      // The failed one is absent from the controller; the order names it and the
      // controller ignores the unknown ucid.
      expect(controller.applyOrder).toHaveBeenCalledWith(["u1", "u2", "u3"]);
      expect(sel.map(x => x.ucid)).toEqual(["u3", "u1"]);
    });
  });

  it("says so when the removed indicator's listing is gone at undo", async () => {
    const controller = makeController();
    controller.selections[0] = { ...controller.selections[0], uiid: "RSI" };
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={vi.fn()}
        onEditIndicator={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "select RSI (5)" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove selected(1)" }));
    controller.listings.length = 0;
    clickUndo();

    expect(await screen.findByText("Could not restore the removed indicators")).toBeInTheDocument();
  });

  it("says so when an undo cannot restore the indicator", async () => {
    const controller = makeController();
    controller.selections[0] = { ...controller.selections[0], uiid: "RSI" };
    controller.addSelection.mockRejectedValue(new Error("gone"));
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={vi.fn()}
        onEditIndicator={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "select RSI (5)" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove selected(1)" }));
    expect(screen.getByRole("region", { name: "Indicator update" })).toHaveAttribute(
      "data-variant",
      "info"
    );
    clickUndo();

    expect(await screen.findByText("Could not restore the removed indicators")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Indicator restore problem" })).toHaveAttribute(
      "data-variant",
      "critical"
    );
  });

  it("shows the result of an add and restores the list position", () => {
    const controller = makeController();
    render(
      <SettingsDialog
        controller={controller as unknown as ChartController}
        onClose={vi.fn()}
        onPickIndicator={vi.fn()}
        onEditIndicator={vi.fn()}
        notice="BB(20,2) added"
        initialScrollTop={120}
      />
    );

    expect(screen.getByText("BB(20,2) added")).toBeInTheDocument();
    expect(document.querySelector(".settings-body")?.scrollTop).toBe(120);
  });

  describe("available indicator filter", () => {
    function renderDialog(props: Partial<Parameters<typeof SettingsDialog>[0]> = {}) {
      const controller = makeController();
      const onPickIndicator = vi.fn();
      const onFilterChange = vi.fn();
      render(
        <SettingsDialog
          controller={controller as unknown as ChartController}
          onClose={vi.fn()}
          onPickIndicator={onPickIndicator}
          onEditIndicator={vi.fn()}
          onFilterChange={onFilterChange}
          {...props}
        />
      );
      const input = screen.getByRole("searchbox", { name: "filter available indicators" });
      return { controller, onPickIndicator, onFilterChange, input };
    }

    it("narrows the list to matching names and reports the count", () => {
      const { input, onFilterChange } = renderDialog();

      fireEvent.change(input, { target: { value: "simple" } });

      expect(screen.getByRole("button", { name: /Simple Moving Average/ })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Relative Strength Index/ })).toBeNull();
      expect(screen.getByText("1 of 2 indicators")).toBeInTheDocument();
      expect(onFilterChange).toHaveBeenLastCalledWith("simple");
    });

    it("matches the category label", () => {
      const { input } = renderDialog();

      fireEvent.change(input, { target: { value: "oscillators" } });

      expect(screen.getByRole("button", { name: /Relative Strength Index/ })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Simple Moving Average/ })).toBeNull();
    });

    it("says so when nothing matches", () => {
      const { input } = renderDialog();

      fireEvent.change(input, { target: { value: "zzz" } });

      expect(screen.getByText("No indicators match")).toBeInTheDocument();
    });

    it("picks the first match on Enter", () => {
      const { controller, input, onPickIndicator } = renderDialog();

      fireEvent.change(input, { target: { value: "sma" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onPickIndicator).toHaveBeenCalledWith(controller.listings[1]);
    });

    it("picks nothing on Enter while the filter is blank", () => {
      const { input, onPickIndicator } = renderDialog();

      fireEvent.keyDown(input, { key: "Enter" });

      expect(onPickIndicator).not.toHaveBeenCalled();
    });

    it("groups the list under category headings", () => {
      changeListingOrder("category");
      renderDialog();

      expect(
        within(screen.getByRole("list", { name: "Oscillators" })).getByRole("button", {
          name: "Relative Strength Index"
        })
      ).toBeInTheDocument();
      expect(
        within(screen.getByRole("list", { name: "Moving averages" })).getByRole("button", {
          name: "Simple Moving Average"
        })
      ).toBeInTheDocument();
    });

    it("exposes each category as a heading", () => {
      changeListingOrder("category");
      renderDialog();

      expect(screen.getByRole("heading", { name: "Oscillators" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Moving averages" })).toBeInTheDocument();
    });

    it("drops a category heading when none of its indicators match", () => {
      changeListingOrder("category");
      const { input } = renderDialog();

      fireEvent.change(input, { target: { value: "relative" } });

      expect(screen.getByRole("list", { name: "Oscillators" })).toBeInTheDocument();
      expect(screen.queryByRole("list", { name: "Moving averages" })).toBeNull();
    });

    it("orders the category headings as the library docs do", () => {
      changeListingOrder("category");
      renderDialog();

      const available = document.querySelector<HTMLElement>(".available-indicators");
      expect(available).not.toBeNull();
      expect(
        within(available as HTMLElement)
          .getAllByRole("heading", { level: 3 })
          .map(h => h.textContent)
      ).toEqual(["Oscillators", "Moving averages"]);
    });

    it("picks the first match shown, in category order, on Enter", () => {
      changeListingOrder("category");
      const controller = makeController();
      // Catalog order puts SMA first, but "Oscillators" comes before "Moving averages".
      controller.listings.reverse();
      const onPickIndicator = vi.fn();
      render(
        <SettingsDialog
          controller={controller as unknown as ChartController}
          onClose={vi.fn()}
          onPickIndicator={onPickIndicator}
          onEditIndicator={vi.fn()}
        />
      );
      const input = screen.getByRole("searchbox", { name: "filter available indicators" });

      fireEvent.change(input, { target: { value: "i" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onPickIndicator).toHaveBeenCalledWith(controller.listings.find(l => l.uiid === "RSI"));
    });

    it("lists A to Z by default, with each category beneath its name", () => {
      const controller = makeController();
      controller.listings.push(makeListing("ADX", "Average Directional Index", "oscillator"));
      render(
        <SettingsDialog
          controller={controller as unknown as ChartController}
          onClose={vi.fn()}
          onPickIndicator={vi.fn()}
          onEditIndicator={vi.fn()}
        />
      );

      expect(screen.getByRole("button", { name: "A to Z" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      const list = screen.getByRole("list", { name: "Available indicators, A to Z" });
      expect(
        within(list)
          .getAllByRole("listitem")
          .map(item => item.textContent)
      ).toEqual([
        "Average Directional IndexOscillators",
        "Relative Strength IndexOscillators",
        "Simple Moving AverageMoving averages"
      ]);
      expect(screen.queryByRole("heading", { name: "Oscillators" })).toBeNull();
    });

    it("groups by category when chosen, and remembers the choice", () => {
      renderDialog();

      fireEvent.click(screen.getByRole("button", { name: "By category" }));

      expect(screen.getByRole("heading", { name: "Oscillators" })).toBeInTheDocument();
      expect(screen.queryByRole("list", { name: "Available indicators, A to Z" })).toBeNull();
      expect(getSettings().listingOrder).toBe("category");
    });

    it("opens A to Z for a visitor who chose it, and picks its first match on Enter", () => {
      changeListingOrder("name");
      const controller = makeController();
      // First A to Z, but in "Moving averages", which comes after "Oscillators" by category.
      const alma = makeListing("ALMA", "Arnaud Legoux Moving Average", "moving-average");
      controller.listings.push(alma);
      const onPickIndicator = vi.fn();
      render(
        <SettingsDialog
          controller={controller as unknown as ChartController}
          onClose={vi.fn()}
          onPickIndicator={onPickIndicator}
          onEditIndicator={vi.fn()}
        />
      );
      const input = screen.getByRole("searchbox", { name: "filter available indicators" });

      fireEvent.change(input, { target: { value: "i" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(screen.getByRole("button", { name: "A to Z" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(onPickIndicator).toHaveBeenCalledWith(alma);
    });

    it("restores the filter when the dialog reopens after an add", () => {
      const { input } = renderDialog({ initialFilter: "relative" });

      expect(input).toHaveValue("relative");
      expect(screen.queryByRole("button", { name: /Simple Moving Average/ })).toBeNull();
    });
  });
});
