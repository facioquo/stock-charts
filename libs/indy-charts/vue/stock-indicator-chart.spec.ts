import { createRenderer, nextTick } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getThemeColors } from "../config";
import { indyChartsVueOptionsKey } from "./context";
import { StockIndicatorChart } from "./stock-indicator-chart";
import { chartSettingsFromOptions } from "./types";
import type { IndyChartsVueOptions } from "./types";

// ChartManager and setupIndyCharts create real Chart.js instances bound to a
// canvas, which the node test renderer can't provide. Mock them so the
// composition logic (panel routing, manager wiring) is exercised in isolation.
// No other test in this file constructs a ChartManager or calls setupIndyCharts.
const managerSpies = vi.hoisted(() => ({ instances: [] as MockChartManager[] }));

interface MockChartManager {
  initializeOverlay: ReturnType<typeof vi.fn>;
  processSelectionData: ReturnType<typeof vi.fn>;
  displaySelection: ReturnType<typeof vi.fn>;
  createOscillator: ReturnType<typeof vi.fn>;
  updateTheme: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
}

vi.mock("../setup", () => ({ setupIndyCharts: vi.fn() }));

vi.mock("../charts", () => {
  class ChartManager {
    initializeOverlay = vi.fn();
    processSelectionData = vi.fn();
    displaySelection = vi.fn();
    createOscillator = vi.fn();
    updateTheme = vi.fn();
    destroy = vi.fn();
    constructor() {
      managerSpies.instances.push(this);
    }
  }
  return { ChartManager };
});

type TestNode = TestElement | TestText;

interface TestElement {
  kind: "element";
  type: string;
  props: Record<string, unknown>;
  children: TestNode[];
  parent: TestElement | null;
}

interface TestText {
  kind: "text";
  text: string;
  parent: TestElement | null;
}

function createTestElement(type: string): TestElement {
  return {
    kind: "element",
    type,
    props: {},
    children: [],
    parent: null
  };
}

function createTestText(text: string): TestText {
  return { kind: "text", text, parent: null };
}

const renderer = createRenderer<TestNode, TestElement>({
  patchProp(element, key, _previousValue, nextValue) {
    if (nextValue === null || nextValue === undefined) {
      delete element.props[key];
      return;
    }

    element.props[key] = nextValue;
  },
  insert(node, parent, anchor) {
    node.parent = parent;

    if (!anchor) {
      parent.children.push(node);
      return;
    }

    const index = parent.children.indexOf(anchor);
    parent.children.splice(index >= 0 ? index : parent.children.length, 0, node);
  },
  remove(node) {
    const parent = node.parent;
    if (!parent) return;

    const index = parent.children.indexOf(node);
    if (index >= 0) {
      parent.children.splice(index, 1);
    }
    node.parent = null;
  },
  createElement(type) {
    return createTestElement(type);
  },
  createText(text) {
    return createTestText(text);
  },
  createComment(text) {
    return createTestText(text);
  },
  setText(node, text) {
    node.text = text;
  },
  setElementText(element, text) {
    const child = createTestText(text);
    child.parent = element;
    element.children = [child];
  },
  parentNode(node) {
    return node.parent;
  },
  nextSibling(node) {
    const parent = node.parent;
    if (!parent) return null;

    const index = parent.children.indexOf(node);
    return parent.children[index + 1] ?? null;
  }
});

function findByTestId(node: TestNode, testId: string): TestElement | undefined {
  if (node.kind !== "element") return undefined;
  if (node.props["data-testid"] === testId) return node;

  for (const child of node.children) {
    const match = findByTestId(child, testId);
    if (match) return match;
  }

  return undefined;
}

function textContent(node: TestNode): string {
  if (node.kind === "text") return node.text;
  return node.children.map(child => textContent(child)).join("");
}

function responseJson(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

const defaultOptions: IndyChartsVueOptions = {
  api: { baseUrl: "https://localhost:5001" },
  indicators: {
    rsi: { uiid: "RSI", results: ["rsi"] }
  }
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("StockIndicatorChart", () => {
  it("reserves chart layout while loading", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => undefined))
    );
    const root = createTestElement("root");
    const app = renderer.createApp(StockIndicatorChart, { indicator: "rsi" });
    app.provide(indyChartsVueOptionsKey, defaultOptions);

    app.mount(root);
    await nextTick();

    const loading = findByTestId(root, "stock-indicator-chart-rsi-loading");
    const layout = findByTestId(root, "stock-indicator-chart-rsi-loading-layout");

    expect(loading).toBeDefined();
    expect(layout).toBeDefined();

    app.unmount();
  });

  it("renders the setup error when Vue options are missing", async () => {
    const root = createTestElement("root");
    const app = renderer.createApp(StockIndicatorChart, { indicator: "rsi" });

    app.mount(root);
    await nextTick();

    const error = findByTestId(root, "stock-indicator-chart-rsi-error");
    expect(error).toBeDefined();
    expect(textContent(error!)).toContain("setupIndyChartsForVue() has not been called.");

    app.unmount();
  });

  it('tags author-facing errors with data-error-kind="author"', async () => {
    const root = createTestElement("root");
    const app = renderer.createApp(StockIndicatorChart, { indicator: "rsi" });
    // Intentionally omit provide() — triggers MISSING_SETUP_ERROR_MESSAGE, which is author-facing.

    app.mount(root);
    await nextTick();

    const error = findByTestId(root, "stock-indicator-chart-rsi-error");
    expect(error).toBeDefined();
    expect(error?.props["data-error-kind"]).toBe("author");

    app.unmount();
  });

  it("renders a stable unavailable message for recoverable API failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("ECONNREFUSED https://localhost:5001/quotes")))
    );
    const root = createTestElement("root");
    const app = renderer.createApp(StockIndicatorChart, { indicator: "rsi" });
    // Disable retries so the error surfaces immediately — retry behaviour is
    // covered by the ApiClient unit tests in client.spec.ts.
    app.provide(indyChartsVueOptionsKey, {
      ...defaultOptions,
      api: { ...defaultOptions.api, retry: false }
    });

    app.mount(root);

    await vi.waitFor(() => {
      const error = findByTestId(root, "stock-indicator-chart-rsi-error");
      expect(error).toBeDefined();
      expect(textContent(error!)).toContain(
        "Chart data is currently unavailable. Check the API service and try again."
      );
      expect(textContent(error!)).not.toContain("ECONNREFUSED");
      expect(error?.props["data-error-kind"]).toBe("data");
    });

    app.unmount();
  });

  it("uses the top-level id prop for the data-testid prefix", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => undefined))
    );
    const root = createTestElement("root");
    const app = renderer.createApp(StockIndicatorChart, { indicator: "rsi", id: "rsi-fast" });
    app.provide(indyChartsVueOptionsKey, defaultOptions);

    app.mount(root);
    await nextTick();

    const rootSection = findByTestId(root, "stock-indicator-chart-rsi-fast-root");
    expect(rootSection).toBeDefined();
    expect(rootSection?.props["id"]).toBe("rsi-fast");
    expect(findByTestId(root, "stock-indicator-chart-rsi-fast-loading")).toBeDefined();
    expect(findByTestId(root, "stock-indicator-chart-rsi-root")).toBeUndefined();

    app.unmount();
  });

  it('falls back to id="chart" when id/config.id/indicator slugify to empty', async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => undefined))
    );
    const root = createTestElement("root");
    const app = renderer.createApp(StockIndicatorChart, { id: "---" });
    app.provide(indyChartsVueOptionsKey, defaultOptions);

    app.mount(root);
    await nextTick();

    const section = findByTestId(root, "stock-indicator-chart-chart-root");
    expect(section).toBeDefined();
    expect(section?.props["id"]).toBe("chart");

    app.unmount();
  });

  it("prefers the top-level id prop over config.id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => undefined))
    );
    const root = createTestElement("root");
    const app = renderer.createApp(StockIndicatorChart, {
      indicator: "rsi",
      id: "outer",
      config: { id: "inner" }
    });
    app.provide(indyChartsVueOptionsKey, defaultOptions);

    app.mount(root);
    await nextTick();

    expect(findByTestId(root, "stock-indicator-chart-outer-root")).toBeDefined();
    expect(findByTestId(root, "stock-indicator-chart-inner-root")).toBeUndefined();

    app.unmount();
  });

  it("preserves author-facing errors for unknown indicators", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL): Promise<Response> => {
        const url = requestUrl(input);
        if (url.endsWith("/quotes")) {
          return Promise.resolve(
            responseJson([
              {
                timestamp: "2024-01-01T00:00:00.000Z",
                open: 100,
                high: 105,
                low: 95,
                close: 101,
                volume: 1000
              }
            ])
          );
        }
        if (url.endsWith("/indicators")) {
          return Promise.resolve(responseJson([]));
        }
        return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
      })
    );
    const root = createTestElement("root");
    const app = renderer.createApp(StockIndicatorChart, { indicator: "rsi" });
    app.provide(indyChartsVueOptionsKey, defaultOptions);

    app.mount(root);

    await vi.waitFor(() => {
      const error = findByTestId(root, "stock-indicator-chart-rsi-error");
      expect(error).toBeDefined();
      expect(textContent(error!)).toContain('Indicator listing not found for uiid "RSI".');
    });

    app.unmount();
  });
});

describe("chartSettingsFromOptions", () => {
  const baseOptions: IndyChartsVueOptions = {
    api: { baseUrl: "https://localhost:5001" }
  };

  it("uses the background argument when provided", () => {
    const options: IndyChartsVueOptions = {
      ...baseOptions,
      theme: { darkBackground: "#dark-theme" }
    };
    const result = chartSettingsFromOptions(options, true, "#prop-bg");
    expect(result.background).toBe("#prop-bg");
  });

  it("falls back to darkBackground when isDarkTheme is true and no background argument", () => {
    const options: IndyChartsVueOptions = {
      ...baseOptions,
      theme: { darkBackground: "#dark-theme", lightBackground: "#light-theme" }
    };
    const result = chartSettingsFromOptions(options, true, undefined);
    expect(result.background).toBe("#dark-theme");
  });

  it("falls back to lightBackground when isDarkTheme is false and no background argument", () => {
    const options: IndyChartsVueOptions = {
      ...baseOptions,
      theme: { darkBackground: "#dark-theme", lightBackground: "#light-theme" }
    };
    const result = chartSettingsFromOptions(options, false, undefined);
    expect(result.background).toBe("#light-theme");
  });

  it("returns undefined background when no override and no theme background are set", () => {
    const result = chartSettingsFromOptions(baseOptions, false, undefined);
    expect(result.background).toBeUndefined();
  });

  it("treats empty-string background as absent and falls back to theme background", () => {
    const options: IndyChartsVueOptions = {
      ...baseOptions,
      theme: { darkBackground: "#dark-theme" }
    };
    const result = chartSettingsFromOptions(options, true, "");
    expect(result.background).toBe("#dark-theme");
  });
});

function makeBollingerListings(): unknown[] {
  const lookback = {
    paramName: "lookbackPeriods",
    displayName: "Periods",
    minimum: 1,
    maximum: 250,
    defaultValue: 20
  };
  const stdDev = {
    paramName: "standardDeviations",
    displayName: "Std Dev",
    minimum: 1,
    maximum: 5,
    defaultValue: 2
  };
  return [
    {
      uiid: "BB",
      name: "Bollinger Bands",
      legendTemplate: "BB([P1],[P2])",
      endpoint: "BB/",
      category: "price-channel",
      chartType: "overlay",
      order: 1,
      chartConfig: null,
      parameters: [lookback, stdDev],
      results: [
        {
          dataName: "upperBand",
          displayName: "Upper Band",
          tooltipTemplate: "Upper",
          defaultColor: "#AAAAAA",
          lineType: "solid",
          lineWidth: 1,
          dataType: "number",
          stack: "",
          order: 1
        }
      ]
    },
    {
      uiid: "BB-PCTB",
      name: "Bollinger Bands %B",
      legendTemplate: "BB([P1],[P2]) %B",
      endpoint: "BB/",
      category: "oscillator",
      chartType: "oscillator",
      order: 2,
      chartConfig: { minimumYAxis: 0, maximumYAxis: 1, thresholds: [] },
      parameters: [lookback, stdDev],
      results: [
        {
          dataName: "percentB",
          displayName: "%B",
          tooltipTemplate: "%B",
          defaultColor: "#8E24AA",
          lineType: "solid",
          lineWidth: 2,
          dataType: "number",
          stack: "",
          order: 1
        }
      ]
    }
  ];
}

function bollingerFetch() {
  const quotes = Array.from({ length: 10 }, (_, i) => ({
    timestamp: new Date(2024, 0, i + 1).toISOString(),
    open: 100 + i,
    high: 105 + i,
    low: 95 + i,
    close: 101 + i,
    volume: 1000 + i
  }));
  const rows = quotes.map(q => ({
    timestamp: q.timestamp,
    candle: q,
    upperBand: 110,
    percentB: 0.5
  }));

  return vi.fn((input: RequestInfo | URL): Promise<Response> => {
    const url = requestUrl(input);
    if (url.endsWith("/quotes")) return Promise.resolve(responseJson(quotes));
    if (url.endsWith("/indicators")) return Promise.resolve(responseJson(makeBollingerListings()));
    if (url.includes("/BB/")) return Promise.resolve(responseJson(rows));
    return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
  });
}

const bollingerOptions: IndyChartsVueOptions = {
  api: { baseUrl: "https://localhost:5001" },
  indicators: {
    bb: { uiid: "BB" },
    bbPctB: { uiid: "BB-PCTB" }
  }
};

describe("StockIndicatorChart composition (with prop)", () => {
  it("composes an overlay indicator and a companion oscillator under one manager", async () => {
    managerSpies.instances.length = 0;
    vi.stubGlobal("fetch", bollingerFetch());

    const root = createTestElement("root");
    const app = renderer.createApp(StockIndicatorChart, {
      indicator: "bb",
      with: "bbPctB",
      id: "bb-combo"
    });
    app.provide(indyChartsVueOptionsKey, bollingerOptions);
    app.mount(root);

    await vi.waitFor(() => {
      expect(findByTestId(root, "stock-indicator-chart-bb-combo-overlay-canvas")).toBeDefined();
      expect(findByTestId(root, "stock-indicator-chart-bb-combo-oscillator-canvas")).toBeDefined();
    });

    // No error state — the chart reached the ready phase.
    expect(findByTestId(root, "stock-indicator-chart-bb-combo-error")).toBeUndefined();

    // Exactly one ChartManager backs both panels.
    expect(managerSpies.instances).toHaveLength(1);
    const mgr = managerSpies.instances[0];
    expect(mgr.initializeOverlay).toHaveBeenCalledTimes(1);
    // Both indicators registered; only the oscillator gets a createOscillator call.
    expect(mgr.displaySelection).toHaveBeenCalledTimes(2);
    expect(mgr.createOscillator).toHaveBeenCalledTimes(1);

    app.unmount();
  });

  it("renders a standalone oscillator without an overlay canvas", async () => {
    managerSpies.instances.length = 0;
    vi.stubGlobal("fetch", bollingerFetch());

    const root = createTestElement("root");
    const app = renderer.createApp(StockIndicatorChart, {
      indicator: "bbPctB",
      id: "pctb-only"
    });
    app.provide(indyChartsVueOptionsKey, bollingerOptions);
    app.mount(root);

    await vi.waitFor(() => {
      expect(findByTestId(root, "stock-indicator-chart-pctb-only-oscillator-canvas")).toBeDefined();
    });

    expect(findByTestId(root, "stock-indicator-chart-pctb-only-overlay-canvas")).toBeUndefined();
    expect(managerSpies.instances).toHaveLength(1);
    const mgr = managerSpies.instances[0];
    expect(mgr.initializeOverlay).not.toHaveBeenCalled();
    expect(mgr.createOscillator).toHaveBeenCalledTimes(1);

    app.unmount();
  });

  it("de-duplicates a companion that repeats the primary indicator", async () => {
    managerSpies.instances.length = 0;
    vi.stubGlobal("fetch", bollingerFetch());

    const root = createTestElement("root");
    const app = renderer.createApp(StockIndicatorChart, {
      indicator: "bb",
      with: ["bb", "bbPctB", "bbPctB"],
      id: "bb-dedup"
    });
    app.provide(indyChartsVueOptionsKey, bollingerOptions);
    app.mount(root);

    await vi.waitFor(() => {
      expect(findByTestId(root, "stock-indicator-chart-bb-dedup-oscillator-canvas")).toBeDefined();
    });

    expect(managerSpies.instances).toHaveLength(1);
    const mgr = managerSpies.instances[0];
    // BB (overlay) + %B (oscillator) only — duplicates collapse away.
    expect(mgr.displaySelection).toHaveBeenCalledTimes(2);
    expect(mgr.createOscillator).toHaveBeenCalledTimes(1);

    app.unmount();
  });
});

describe("getThemeColors", () => {
  it("overrides background when settings.background is set", () => {
    const colors = getThemeColors({ isDarkTheme: true, showTooltips: true, background: "#custom" });
    expect(colors.background).toBe("#custom");
  });

  it("returns the dark theme default background when settings.background is absent", () => {
    const colors = getThemeColors({ isDarkTheme: true, showTooltips: true });
    expect(colors.background).toBe("#12131680");
  });

  it("returns the light theme default background when isDarkTheme is false", () => {
    const colors = getThemeColors({ isDarkTheme: false, showTooltips: true });
    expect(colors.background).toBe("#FAF9FD90");
  });
});
