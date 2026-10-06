import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDefaultSelection } from "@facioquo/indy-charts";
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

import { decodeSelections, encodeSelections, SHARE_PARAM } from "./shareLink";
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

  async function loadWithCache(
    cached: IndicatorSelection[],
    getSelectionData: ApiClient["getSelectionData"]
  ): Promise<ChartController> {
    const overlay = document.createElement("canvas");
    overlay.id = "chartOverlay";
    document.body.appendChild(overlay);
    const zone = document.createElement("div");
    zone.id = "oscillators-zone";
    document.body.appendChild(zone);

    localStorage.setItem("selections", JSON.stringify(cached));
    const listings = ["SLOW", "FAST", "A", "B"].map(uiid => makeListing(uiid, "oscillator"));
    const controller = new ChartController(
      makeApi({ getListings: vi.fn().mockResolvedValue(listings), getSelectionData })
    );
    await controller.loadCharts();
    return controller;
  }

  it("builds restored indicators in list order whatever order their data arrives in", async () => {
    const slow = makeSelection("SLOW", "oscillator");
    const fast = makeSelection("FAST", "oscillator");
    const getSelectionData = vi.fn(
      (selection: IndicatorSelection) =>
        new Promise<unknown[]>(resolve => {
          setTimeout(
            () => {
              resolve([{}]);
            },
            selection.uiid === "SLOW" ? 30 : 0
          );
        })
    ) as unknown as ApiClient["getSelectionData"];

    const controller = await loadWithCache([slow, fast], getSelectionData);

    await vi.waitFor(() => {
      expect(manager(controller).displaySelection).toHaveBeenCalledTimes(2);
    });
    expect(controller.selections.map(s => s.ucid)).toEqual([slow.ucid, fast.ucid]);
    const zone = document.getElementById("oscillators-zone");
    expect(Array.from(zone?.children ?? []).map(c => c.id)).toEqual([
      `${slow.ucid}-container`,
      `${fast.ucid}-container`
    ]);
  });

  it("keeps the saved list when no restored indicator can load", async () => {
    const saved = [makeSelection("SLOW", "oscillator")];
    const getSelectionData = vi
      .fn()
      .mockRejectedValue(new Error("offline")) as unknown as ApiClient["getSelectionData"];
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const controller = await loadWithCache(saved, getSelectionData);

    await vi.waitFor(() => {
      expect(getSelectionData).toHaveBeenCalled();
    });
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(manager(controller).displaySelection).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem("selections") ?? "[]")).toHaveLength(1);
  });

  it("builds each restored chart once it and those before it settle", async () => {
    const first = makeSelection("SLOW", "oscillator");
    const stalled = makeSelection("FAST", "oscillator");
    const getSelectionData = vi.fn((selection: IndicatorSelection) =>
      selection.uiid === "SLOW" ? Promise.resolve([{}]) : new Promise<unknown[]>(() => undefined)
    ) as unknown as ApiClient["getSelectionData"];

    const controller = await loadWithCache([first, stalled], getSelectionData);

    // The stalled request holds back only the charts after it.
    await vi.waitFor(() => {
      expect(controller.selections.map(s => s.ucid)).toEqual([first.ucid]);
    });
  });

  it("saves an indicator added during restore together with the restored ones", async () => {
    const restored = [makeSelection("SLOW", "oscillator"), makeSelection("FAST", "oscillator")];
    const releases: Array<() => void> = [];
    const getSelectionData = vi.fn(
      () =>
        new Promise<unknown[]>(resolve => {
          releases.push(() => {
            resolve([{}]);
          });
        })
    ) as unknown as ApiClient["getSelectionData"];
    const controller = await loadWithCache(restored, getSelectionData);
    const saved = (): string[] =>
      (JSON.parse(localStorage.getItem("selections") ?? "[]") as Array<{ uiid: string }>).map(
        s => s.uiid
      );

    // A user add lands while the restore is still waiting on its fetches.
    const added = makeSelection("ADDED", "overlay");
    const addedRequest = controller.addSelection(added, makeListing("ADDED", "overlay"));
    releases.at(-1)?.();
    await addedRequest;
    expect(saved()).toEqual(["SLOW", "FAST"]);

    releases.slice(0, 2).forEach(release => {
      release();
    });
    await vi.waitFor(() => {
      expect(saved()).toEqual(["SLOW", "FAST", "ADDED"]);
    });
  });

  it("skips a restore fetch that never settles so later saves are not held", async () => {
    vi.useFakeTimers();
    try {
      const stalled = makeSelection("SLOW", "oscillator");
      const getSelectionData = vi
        .fn()
        .mockReturnValueOnce(new Promise<unknown[]>(() => undefined))
        .mockResolvedValue([{}]) as unknown as ApiClient["getSelectionData"];
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const savedUiids = (): string[] =>
        (JSON.parse(localStorage.getItem("selections") ?? "[]") as Array<{ uiid: string }>).map(
          s => s.uiid
        );
      const controller = await loadWithCache([stalled], getSelectionData);

      await controller.addSelection(
        makeSelection("FAST", "oscillator"),
        makeListing("FAST", "oscillator")
      );
      // Still restoring: the saved list is untouched.
      expect(savedUiids()).toEqual(["SLOW"]);

      await vi.advanceTimersByTimeAsync(15_000);
      // The stalled fetch was given up on, but its selection stays saved alongside the add.
      expect(savedUiids()).toEqual(["SLOW", "FAST"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps a timed-out restore selection saved across later user actions", async () => {
    vi.useFakeTimers();
    try {
      const getSelectionData = vi
        .fn()
        .mockReturnValueOnce(new Promise<unknown[]>(() => undefined))
        .mockResolvedValue([{}]) as unknown as ApiClient["getSelectionData"];
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const savedUiids = (): string[] =>
        (JSON.parse(localStorage.getItem("selections") ?? "[]") as Array<{ uiid: string }>).map(
          s => s.uiid
        );
      const controller = await loadWithCache([makeSelection("SLOW", "overlay")], getSelectionData);
      await vi.advanceTimersByTimeAsync(15_000);

      await controller.addSelection(makeSelection("A", "overlay"), makeListing("A", "overlay"));
      await controller.addSelection(makeSelection("B", "overlay"), makeListing("B", "overlay"));
      const [first] = controller.selections;
      controller.moveSelection(first.ucid, 1);

      expect(savedUiids()).toEqual(["SLOW", "B", "A"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("saves a timed-out restore selection in its original slot after a user action", async () => {
    vi.useFakeTimers();
    try {
      const getSelectionData = vi.fn((selection: { uiid: string }) =>
        selection.uiid === "SLOW" ? new Promise<unknown[]>(() => undefined) : Promise.resolve([{}])
      ) as unknown as ApiClient["getSelectionData"];
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const savedUiids = (): string[] =>
        (JSON.parse(localStorage.getItem("selections") ?? "[]") as Array<{ uiid: string }>).map(
          s => s.uiid
        );
      const controller = await loadWithCache(
        [
          makeSelection("A", "oscillator"),
          makeSelection("SLOW", "oscillator"),
          makeSelection("B", "oscillator")
        ],
        getSelectionData
      );
      await vi.advanceTimersByTimeAsync(15_000);
      expect(savedUiids()).toEqual(["A", "SLOW", "B"]);

      await controller.addSelection(
        makeSelection("C", "oscillator"),
        makeListing("C", "oscillator")
      );
      expect(savedUiids()).toEqual(["A", "SLOW", "B", "C"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps a restore selection whose fetch failed, so a transient error does not delete it", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const getSelectionData = vi.fn((selection: { uiid: string }) =>
      selection.uiid === "B" ? Promise.reject(new Error("500")) : Promise.resolve([{}])
    ) as unknown as ApiClient["getSelectionData"];
    const controller = await loadWithCache(
      [makeSelection("A", "oscillator"), makeSelection("B", "oscillator")],
      getSelectionData
    );
    await vi.waitFor(() => {
      expect(controller.selections.map(s => s.uiid)).toEqual(["A"]);
    });

    expect(
      (JSON.parse(localStorage.getItem("selections") ?? "[]") as Array<{ uiid: string }>).map(
        s => s.uiid
      )
    ).toEqual(["A", "B"]);
  });

  it("editing the only displayed indicator keeps a restore failure saved", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const getSelectionData = vi.fn((selection: { uiid: string }) =>
      selection.uiid === "B" ? Promise.reject(new Error("500")) : Promise.resolve([{}])
    ) as unknown as ApiClient["getSelectionData"];
    const controller = await loadWithCache(
      [makeSelection("A", "oscillator"), makeSelection("B", "oscillator")],
      getSelectionData
    );
    await vi.waitFor(() => {
      expect(controller.selections).toHaveLength(1);
    });
    const shown = controller.selections[0];
    if (!shown) throw new Error("expected a displayed indicator");

    await controller.updateSelection(shown.ucid, shown, makeListing("A", "oscillator"));

    expect(
      (JSON.parse(localStorage.getItem("selections") ?? "[]") as Array<{ uiid: string }>).map(
        s => s.uiid
      )
    ).toEqual(["A", "B"]);
  });

  it("keeps a restore selection whose draw throws, in its saved place", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const getSelectionData = vi
      .fn()
      .mockResolvedValue([{}]) as unknown as ApiClient["getSelectionData"];
    // Restoring A, B, SLOW: the second draw throws.
    const controller = await (async () => {
      const overlay = document.createElement("canvas");
      overlay.id = "chartOverlay";
      document.body.appendChild(overlay);
      const zone = document.createElement("div");
      zone.id = "oscillators-zone";
      document.body.appendChild(zone);
      localStorage.setItem(
        "selections",
        JSON.stringify(["A", "B", "SLOW"].map(uiid => makeSelection(uiid, "oscillator")))
      );
      const listings = ["A", "B", "SLOW"].map(uiid => makeListing(uiid, "oscillator"));
      const instance = new ChartController(
        makeApi({ getListings: vi.fn().mockResolvedValue(listings), getSelectionData })
      );
      manager(instance).processSelectionData.mockImplementationOnce(() => undefined);
      manager(instance).processSelectionData.mockImplementationOnce(() => {
        throw new Error("bad rows");
      });
      await instance.loadCharts();
      return instance;
    })();
    await vi.waitFor(() => {
      expect(controller.selections.map(s => s.uiid)).toEqual(["A", "SLOW"]);
    });

    expect(
      (JSON.parse(localStorage.getItem("selections") ?? "[]") as Array<{ uiid: string }>).map(
        s => s.uiid
      )
    ).toEqual(["A", "B", "SLOW"]);
  });

  it("removing every displayed indicator also drops what could not be restored", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const getSelectionData = vi.fn((selection: { uiid: string }) =>
      selection.uiid === "B" ? Promise.reject(new Error("500")) : Promise.resolve([{}])
    ) as unknown as ApiClient["getSelectionData"];
    const controller = await loadWithCache(
      [makeSelection("A", "oscillator"), makeSelection("B", "oscillator")],
      getSelectionData
    );
    await vi.waitFor(() => {
      expect(controller.selections).toHaveLength(1);
    });

    controller.deleteSelection(controller.selections[0]?.ucid ?? "");

    expect(JSON.parse(localStorage.getItem("selections") ?? "null")).toEqual([]);
  });

  it("joins a load already in flight instead of restoring every indicator twice", async () => {
    const getSelectionData = vi
      .fn()
      .mockResolvedValue([{}]) as unknown as ApiClient["getSelectionData"];
    const overlay = document.createElement("canvas");
    overlay.id = "chartOverlay";
    document.body.appendChild(overlay);
    const zone = document.createElement("div");
    zone.id = "oscillators-zone";
    document.body.appendChild(zone);
    const listings = ["A", "B"].map(uiid => makeListing(uiid, "oscillator"));
    localStorage.setItem(
      "selections",
      JSON.stringify(["A", "B"].map(uiid => makeSelection(uiid, "oscillator")))
    );
    const getListings = vi.fn().mockResolvedValue(listings);
    const controller = new ChartController(makeApi({ getListings, getSelectionData }));

    await Promise.all([controller.loadCharts(), controller.loadCharts()]);

    await vi.waitFor(() => {
      expect(controller.selections).toHaveLength(2);
    });
    expect(getListings).toHaveBeenCalledTimes(1);

    // The singleton controller is loaded again on every page mount.
    await controller.loadCharts();
    expect(getListings).toHaveBeenCalledTimes(2);
  });

  describe("share link", () => {
    const savedUiids = (): string[] =>
      (JSON.parse(localStorage.getItem("selections") ?? "[]") as Array<{ uiid: string }>).map(
        s => s.uiid
      );
    const catalog = ["SLOW", "FAST", "A", "B"].map(uiid => makeListing(uiid, "oscillator"));
    const fetchRows = vi.fn().mockResolvedValue([{}]) as unknown as ApiClient["getSelectionData"];
    const linkTo = (...uiids: string[]): void => {
      const encoded = encodeSelections(
        uiids.map(uiid => makeSelection(uiid, "oscillator")),
        catalog
      );
      window.history.replaceState(null, "", `/?${SHARE_PARAM}=${encoded}`);
    };

    beforeEach(() => {
      vi.mocked(createDefaultSelection).mockImplementation(listing => ({
        ucid: `ucid-${listing.uiid}`,
        uiid: listing.uiid,
        label: listing.legendTemplate,
        chartType: listing.chartType,
        params: [],
        results: []
      }));
    });

    afterEach(() => {
      vi.mocked(createDefaultSelection).mockReset();
      window.history.replaceState(null, "", "/");
    });

    it("shows the linked indicators without overwriting the saved list", async () => {
      linkTo("FAST", "B");
      const controller = await loadWithCache([makeSelection("A", "oscillator")], fetchRows);
      await vi.waitFor(() => {
        expect(controller.selections.map(s => s.uiid)).toEqual(["FAST", "B"]);
      });

      expect(savedUiids()).toEqual(["A"]);
    });

    it("saves the linked list with the first change and drops the parameter", async () => {
      linkTo("FAST", "B");
      const controller = await loadWithCache([makeSelection("A", "oscillator")], fetchRows);
      await vi.waitFor(() => {
        expect(controller.selections).toHaveLength(2);
      });

      await controller.addSelection(
        makeSelection("SLOW", "oscillator"),
        makeListing("SLOW", "oscillator")
      );

      expect(savedUiids()).toEqual(["FAST", "B", "SLOW"]);
      expect(new URLSearchParams(window.location.search).has(SHARE_PARAM)).toBe(false);
    });

    it("keeps a change made while the link is still restoring", async () => {
      linkTo("FAST", "B");
      const controller = await loadWithCache([makeSelection("A", "oscillator")], fetchRows);
      await controller.addSelection(
        makeSelection("SLOW", "oscillator"),
        makeListing("SLOW", "oscillator")
      );

      await vi.waitFor(() => {
        expect(savedUiids().sort()).toEqual(["B", "FAST", "SLOW"]);
      });
    });

    it("falls back to the saved list when the link cannot be read", async () => {
      window.history.replaceState(null, "", `/?${SHARE_PARAM}=9.garbage`);
      const controller = await loadWithCache([makeSelection("A", "oscillator")], fetchRows);
      await vi.waitFor(() => {
        expect(controller.selections.map(s => s.uiid)).toEqual(["A"]);
      });
    });

    it("builds a link that restores the displayed indicators", async () => {
      const controller = await loadWithCache(
        [makeSelection("A", "oscillator"), makeSelection("B", "oscillator")],
        fetchRows
      );
      await vi.waitFor(() => {
        expect(controller.selections).toHaveLength(2);
      });

      const encoded = new URL(controller.shareUrl()).searchParams.get(SHARE_PARAM) ?? "";
      expect(decodeSelections(encoded, catalog).map(s => s.uiid)).toEqual(["A", "B"]);
    });
  });

  describe("moveSelection", () => {
    async function withSelections(
      specs: Array<[string, "overlay" | "oscillator"]>
    ): Promise<ChartController> {
      const zone = document.createElement("div");
      zone.id = "oscillators-zone";
      document.body.appendChild(zone);
      const api = makeApi({ getSelectionData: vi.fn().mockResolvedValue([{}]) });
      const controller = new ChartController(api);
      for (const [uiid, chartType] of specs) {
        await controller.addSelection(makeSelection(uiid, chartType), makeListing(uiid, chartType));
      }
      return controller;
    }

    it("swaps within the group and leaves the other group where it is", async () => {
      const controller = await withSelections([
        ["A", "overlay"],
        ["X", "oscillator"],
        ["B", "overlay"],
        ["Y", "oscillator"]
      ]);

      controller.moveSelection("ucid-B", -1);

      expect(controller.selections.map(s => s.uiid)).toEqual(["B", "X", "A", "Y"]);
      expect(manager(controller).reorderSelections).toHaveBeenCalledWith([
        "ucid-B",
        "ucid-X",
        "ucid-A",
        "ucid-Y"
      ]);
    });

    it("moves an oscillator's canvas with it and caches the new order", async () => {
      const controller = await withSelections([
        ["X", "oscillator"],
        ["Y", "oscillator"],
        ["Z", "oscillator"]
      ]);

      controller.moveSelection("ucid-X", 1);

      const zone = document.getElementById("oscillators-zone");
      expect(Array.from(zone?.children ?? []).map(c => c.id)).toEqual([
        "ucid-Y-container",
        "ucid-X-container",
        "ucid-Z-container"
      ]);
      const cached = JSON.parse(localStorage.getItem("selections") ?? "[]") as Array<{
        ucid: string;
      }>;
      expect(cached.map(s => s.ucid)).toEqual(["ucid-Y", "ucid-X", "ucid-Z"]);
    });

    it("moves an oscillator's canvas up", async () => {
      const controller = await withSelections([
        ["X", "oscillator"],
        ["Y", "oscillator"],
        ["Z", "oscillator"]
      ]);

      controller.moveSelection("ucid-Z", -1);

      const zone = document.getElementById("oscillators-zone");
      expect(Array.from(zone?.children ?? []).map(c => c.id)).toEqual([
        "ucid-X-container",
        "ucid-Z-container",
        "ucid-Y-container"
      ]);
    });

    it("orders canvases by the model when one selection has no canvas", async () => {
      const controller = await withSelections([
        ["X", "oscillator"],
        ["Y", "oscillator"],
        ["Z", "oscillator"]
      ]);
      document.getElementById("ucid-X-container")?.remove();

      controller.moveSelection("ucid-Z", -1);

      const zone = document.getElementById("oscillators-zone");
      expect(Array.from(zone?.children ?? []).map(c => c.id)).toEqual([
        "ucid-Z-container",
        "ucid-Y-container"
      ]);
      expect(controller.selections.map(s => s.uiid)).toEqual(["X", "Z", "Y"]);
    });

    it("does nothing at the end of a group or for an unknown ucid", async () => {
      const controller = await withSelections([
        ["A", "overlay"],
        ["X", "oscillator"]
      ]);

      controller.moveSelection("ucid-A", -1);
      controller.moveSelection("ucid-X", 1);
      controller.moveSelection("missing", 1);

      expect(manager(controller).reorderSelections).not.toHaveBeenCalled();
    });
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
