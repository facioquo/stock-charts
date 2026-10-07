import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { IndicatorListing, IndicatorSelection } from "@facioquo/indy-charts";

import type { ApiClient } from "../api/apiClient";

/**
 * Vitest smoke-test parity port of the Angular `ChartService` spec
 * (`client/src/app/services/chart.service.spec.ts`). The Angular spec mocked a
 * canvas context and drove a real `ChartManager`; here we mock `ChartManager`
 * (the framework-agnostic core lives in `@facioquo/indy-charts` and has its own
 * tests) and verify the ChartController orchestration that was ported:
 * initialization, indicator add/remove lifecycle (incl. oscillator DOM),
 * theme propagation, and resize/bar-count recomputation.
 */

// Minimal stateful ChartManager double. Arrow-function fields close over the
// instance, so `selections` is per-controller (fresh each `new ChartController`).
vi.mock("@facioquo/indy-charts", () => {
  interface SelLike {
    ucid: string;
    chartType?: string;
  }

  class ChartManager {
    selections: SelLike[] = [];
    initializeOverlay = vi.fn();
    processSelectionData = vi.fn();
    displaySelection = vi.fn((sel: SelLike) => {
      if (!this.selections.some(s => s.ucid === sel.ucid)) this.selections.push(sel);
    });
    createOscillator = vi.fn();
    reorderSelections = vi.fn((ucids: string[]) => {
      this.selections.sort((a, b) => ucids.indexOf(a.ucid) - ucids.indexOf(b.ucid));
    });
    removeSelection = vi.fn((ucid: string) => {
      const index = this.selections.findIndex(s => s.ucid === ucid);
      if (index >= 0) this.selections.splice(index, 1);
    });
    updateTheme = vi.fn();
    setBarCount = vi.fn();
    resize = vi.fn();
    destroy = vi.fn();
  }

  return {
    ChartManager,
    createDefaultSelection: vi.fn(),
    applySelectionTokens: vi.fn()
  };
});

import { ChartController } from "./chartController";

type MockFn = ReturnType<typeof vi.fn>;

interface MockManager {
  selections: Array<{ ucid: string; chartType?: string }>;
  initializeOverlay: MockFn;
  processSelectionData: MockFn;
  displaySelection: MockFn;
  createOscillator: MockFn;
  removeSelection: MockFn;
  reorderSelections: MockFn;
  updateTheme: MockFn;
  setBarCount: MockFn;
  resize: MockFn;
  destroy: MockFn;
}

/** Access the controller's private ChartManager double for assertions. */
function manager(controller: ChartController): MockManager {
  return (controller as unknown as { chartManager: MockManager }).chartManager;
}

function makeApi(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    isBackupActive: false,
    getQuotes: vi.fn().mockResolvedValue([]),
    getListings: vi.fn().mockResolvedValue([]),
    getSelectionData: vi.fn().mockResolvedValue([]),
    ...overrides
  } as unknown as ApiClient;
}

function makeListing(uiid: string, chartType: "overlay" | "oscillator"): IndicatorListing {
  return {
    name: uiid,
    uiid,
    legendTemplate: uiid,
    endpoint: `/${uiid}/`,
    category: "test",
    chartType,
    order: 0,
    chartConfig: null,
    parameters: [],
    results: []
  };
}

function makeSelection(uiid: string, chartType: "overlay" | "oscillator"): IndicatorSelection {
  return {
    ucid: `ucid-${uiid}`,
    uiid,
    label: uiid,
    chartType,
    params: [],
    results: []
  };
}

describe("ChartController", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
    // jsdom canvases return null for getContext; stub a truthy 2d context so the
    // overlay/oscillator code paths proceed.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      {} as unknown as CanvasRenderingContext2D
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("starts in the loading state and notifies subscribers when state changes", async () => {
    const controller = new ChartController(makeApi());
    expect(controller.getState()).toEqual({ loading: true, apiError: false });

    const listener = vi.fn();
    const unsubscribe = controller.subscribe(listener);

    // No #chartOverlay canvas in the DOM → loadCharts cannot acquire a context
    // and flips loading off, which fires the listener.
    await controller.loadCharts();

    expect(listener).toHaveBeenCalled();
    expect(controller.getState().loading).toBe(false);
    unsubscribe();
  });

  it("initializes the overlay chart and stores listings on the happy path", async () => {
    const overlay = document.createElement("canvas");
    overlay.id = "chartOverlay";
    document.body.appendChild(overlay);

    const quotes = [
      {
        timestamp: new Date("2024-01-02T00:00:00Z"),
        open: 1,
        high: 2,
        low: 0.5,
        close: 1.5,
        volume: 100
      }
    ];
    // Listings that don't match any default uiid → no async selection hydration.
    const listings = [makeListing("FOO", "overlay")];
    const api = makeApi({
      getQuotes: vi.fn().mockResolvedValue(quotes),
      getListings: vi.fn().mockResolvedValue(listings)
    });

    const controller = new ChartController(api);
    await controller.loadCharts();

    const cm = manager(controller);
    expect(cm.initializeOverlay).toHaveBeenCalledTimes(1);
    const [ctx, passedQuotes, barCount] = cm.initializeOverlay.mock.calls[0];
    expect(ctx).toBeTruthy();
    expect(passedQuotes).toBe(quotes);
    expect(typeof barCount).toBe("number");
    expect(controller.listings).toBe(listings);
    expect(controller.getState().loading).toBe(false);
  });

  it("processes, displays, and caches an overlay indicator via addSelection", async () => {
    const api = makeApi({ getSelectionData: vi.fn().mockResolvedValue([{}]) });
    const controller = new ChartController(api);
    const selection = makeSelection("X", "overlay");
    const listing = makeListing("X", "overlay");

    await controller.addSelection(selection, listing);

    const cm = manager(controller);
    expect(cm.processSelectionData).toHaveBeenCalled();
    expect(cm.displaySelection).toHaveBeenCalledWith(selection, listing);
    expect(controller.selections.some(s => s.ucid === selection.ucid)).toBe(true);
    expect(localStorage.getItem("selections")).toBeTruthy();
  });

  it("creates an oscillator DOM container for oscillator indicators", async () => {
    const zone = document.createElement("div");
    zone.id = "oscillators-zone";
    document.body.appendChild(zone);

    const api = makeApi({ getSelectionData: vi.fn().mockResolvedValue([{}]) });
    const controller = new ChartController(api);
    const selection = makeSelection("OSC", "oscillator");
    const listing = makeListing("OSC", "oscillator");

    await controller.addSelection(selection, listing, true);

    const cm = manager(controller);
    expect(cm.createOscillator).toHaveBeenCalled();
    expect(document.getElementById(`${selection.ucid}-container`)).not.toBeNull();
  });

  it("removes the indicator and its oscillator container via deleteSelection", async () => {
    const zone = document.createElement("div");
    zone.id = "oscillators-zone";
    document.body.appendChild(zone);

    const api = makeApi({ getSelectionData: vi.fn().mockResolvedValue([{}]) });
    const controller = new ChartController(api);
    const selection = makeSelection("OSC", "oscillator");
    const listing = makeListing("OSC", "oscillator");
    await controller.addSelection(selection, listing, false);

    controller.deleteSelection(selection.ucid);

    const cm = manager(controller);
    expect(cm.removeSelection).toHaveBeenCalledWith(selection.ucid);
    expect(document.getElementById(`${selection.ucid}-container`)).toBeNull();
    expect(controller.selections.some(s => s.ucid === selection.ucid)).toBe(false);
  });

  it("replaces an oscillator in place, keeping its ucid and stack position", async () => {
    const zone = document.createElement("div");
    zone.id = "oscillators-zone";
    document.body.appendChild(zone);

    const api = makeApi({ getSelectionData: vi.fn().mockResolvedValue([{}]) });
    const controller = new ChartController(api);
    const listing = makeListing("OSC", "oscillator");
    const first = makeSelection("OSC", "oscillator");
    const second = { ...makeSelection("OSC", "oscillator"), ucid: "second" };
    await controller.addSelection(first, listing, false);
    await controller.addSelection(second, listing, false);

    await controller.updateSelection(first.ucid, { ...first, label: "OSC(14)" }, listing);

    const order = Array.from(zone.children).map(child => child.id);
    expect(order).toEqual([`${first.ucid}-container`, `${second.ucid}-container`]);
    // The manager's list, and so the cached order, keeps the edited indicator first.
    expect(controller.selections.map(s => s.ucid)).toEqual([first.ucid, second.ucid]);
    expect(
      JSON.parse(localStorage.getItem("selections") ?? "[]").map((s: { ucid: string }) => s.ucid)
    ).toEqual([first.ucid, second.ucid]);
    expect(manager(controller).removeSelection).toHaveBeenCalledWith(first.ucid);
    expect(controller.selections.filter(s => s.ucid === first.ucid)).toHaveLength(1);
    // The resolved label is reset to the template so new parameter values apply.
    expect(controller.selections.find(s => s.ucid === first.ucid)?.label).toBe(
      listing.legendTemplate
    );
  });

  it("leaves the chart unchanged when the edited data fails to load", async () => {
    const zone = document.createElement("div");
    zone.id = "oscillators-zone";
    document.body.appendChild(zone);

    const getSelectionData = vi.fn().mockResolvedValueOnce([{}]);
    const controller = new ChartController(makeApi({ getSelectionData }));
    const listing = makeListing("OSC", "oscillator");
    const selection = makeSelection("OSC", "oscillator");
    await controller.addSelection(selection, listing, false);

    getSelectionData.mockRejectedValueOnce(new Error("bad params"));
    await expect(controller.updateSelection(selection.ucid, selection, listing)).rejects.toThrow(
      "bad params"
    );

    expect(manager(controller).removeSelection).not.toHaveBeenCalled();
    expect(document.getElementById(`${selection.ucid}-container`)).not.toBeNull();
  });

  it("removes the indicator when drawing the replacement fails, and saving again adds it back", async () => {
    const zone = document.createElement("div");
    zone.id = "oscillators-zone";
    document.body.appendChild(zone);

    const controller = new ChartController(
      makeApi({ getSelectionData: vi.fn().mockResolvedValue([{}]) })
    );
    const listing = makeListing("OSC", "oscillator");
    const selection = makeSelection("OSC", "oscillator");
    await controller.addSelection(selection, listing, false);

    manager(controller).processSelectionData.mockImplementationOnce(() => {
      throw new Error("bad rows");
    });
    await expect(controller.updateSelection(selection.ucid, selection, listing)).rejects.toThrow(
      "bad rows"
    );
    expect(controller.selections.some(s => s.ucid === selection.ucid)).toBe(false);

    // The dialog's RETRY calls updateSelection again for the same ucid.
    await controller.updateSelection(selection.ucid, selection, listing);
    expect(controller.selections.filter(s => s.ucid === selection.ucid)).toHaveLength(1);
    expect(document.getElementById(`${selection.ucid}-container`)).not.toBeNull();
  });

  it("propagates theme/tooltip settings to the chart manager", () => {
    const controller = new ChartController(makeApi());

    controller.onSettingsChange();

    const cm = manager(controller);
    expect(cm.updateTheme).toHaveBeenCalledTimes(1);
    expect(cm.updateTheme).toHaveBeenCalledWith(
      expect.objectContaining({
        isDarkTheme: expect.any(Boolean),
        showTooltips: expect.any(Boolean)
      })
    );
  });

  it("recomputes the bar count and resizes charts on window resize", () => {
    const controller = new ChartController(makeApi());

    controller.onWindowResize({ width: 1000, height: 600 });

    const cm = manager(controller);
    expect(cm.setBarCount).toHaveBeenCalledWith(200);
    expect(cm.resize).toHaveBeenCalledTimes(1);
  });

  it("tears down the chart manager on destroy", () => {
    const controller = new ChartController(makeApi());

    controller.destroy();

    expect(manager(controller).destroy).toHaveBeenCalledTimes(1);
  });
});
