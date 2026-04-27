import { createRenderer, nextTick } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";

import { indyChartsVitePressOptionsKey } from "./context";
import { StockIndicatorChart } from "./stock-indicator-chart";
import type { IndyChartsVitePressOptions } from "./types";

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

const defaultOptions: IndyChartsVitePressOptions = {
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
    app.provide(indyChartsVitePressOptionsKey, defaultOptions);

    app.mount(root);
    await nextTick();

    const loading = findByTestId(root, "stock-indicator-chart-rsi-loading");
    const layout = findByTestId(root, "stock-indicator-chart-rsi-loading-layout");

    expect(loading).toBeDefined();
    expect(layout).toBeDefined();
    expect(textContent(layout!)).toContain("Price + volume");

    app.unmount();
  });

  it("renders the setup error when VitePress options are missing", async () => {
    const root = createTestElement("root");
    const app = renderer.createApp(StockIndicatorChart, { indicator: "rsi" });

    app.mount(root);
    await nextTick();

    const error = findByTestId(root, "stock-indicator-chart-rsi-error");
    expect(error).toBeDefined();
    expect(textContent(error!)).toContain("setupIndyChartsForVitePress() has not been called.");

    app.unmount();
  });

  it("renders a stable unavailable message for recoverable API failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("ECONNREFUSED https://localhost:5001/quotes")))
    );
    const root = createTestElement("root");
    const app = renderer.createApp(StockIndicatorChart, { indicator: "rsi" });
    app.provide(indyChartsVitePressOptionsKey, defaultOptions);

    app.mount(root);

    await vi.waitFor(() => {
      const error = findByTestId(root, "stock-indicator-chart-rsi-error");
      expect(error).toBeDefined();
      expect(textContent(error!)).toContain(
        "Chart data is currently unavailable. Check the API service and try again."
      );
      expect(textContent(error!)).not.toContain("ECONNREFUSED");
    });

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
                date: "2024-01-01T00:00:00.000Z",
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
    app.provide(indyChartsVitePressOptionsKey, defaultOptions);

    app.mount(root);

    await vi.waitFor(() => {
      const error = findByTestId(root, "stock-indicator-chart-rsi-error");
      expect(error).toBeDefined();
      expect(textContent(error!)).toContain('Indicator listing not found for uiid "RSI".');
    });

    app.unmount();
  });
});
