import { afterEach, describe, expect, it, vi } from "vitest";

import { calculateOptimalBars, getWindowSize, subscribeResize } from "./windowSize";

/**
 * Vitest parity port of the Angular `WindowService` spec
 * (`client/src/app/services/window.service.spec.ts`). The bar-count heuristic
 * (~5px/bar, min 20, max 500), window-size read, and the debounced/deduplicated
 * resize stream are preserved; the Angular RxJS `getResizeObservable` is
 * replaced by `subscribeResize` (callback + unsubscribe), tested here with fake
 * timers to drive the 150ms debounce deterministically.
 */
function setWindowSize(width: number, height: number): void {
  Object.defineProperty(window, "innerWidth", { value: width, configurable: true, writable: true });
  Object.defineProperty(window, "innerHeight", {
    value: height,
    configurable: true,
    writable: true
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("calculateOptimalBars", () => {
  it("calculates bars at the ~5px-per-bar ratio", () => {
    expect(calculateOptimalBars(1000)).toBe(200);
  });

  it("enforces the minimum bar count", () => {
    expect(calculateOptimalBars(50)).toBe(20);
  });

  it("enforces the maximum bar count", () => {
    expect(calculateOptimalBars(3000)).toBe(500);
  });

  it("uses the window width when no container width is provided", () => {
    setWindowSize(1200, 800);
    expect(calculateOptimalBars()).toBe(240);
  });

  it("respects an explicit zero width and clamps to the minimum", () => {
    // Nullish coalescing (not ||) means an explicit 0 is honoured, then clamped.
    expect(calculateOptimalBars(0)).toBe(20);
  });
});

describe("getWindowSize", () => {
  it("returns the current window dimensions", () => {
    setWindowSize(1920, 1080);
    expect(getWindowSize()).toEqual({ width: 1920, height: 1080 });
  });
});

describe("subscribeResize", () => {
  it("debounces rapid resize events and emits once with the latest dimensions", () => {
    vi.useFakeTimers();
    const handler = vi.fn();
    const unsubscribe = subscribeResize(handler);

    setWindowSize(800, 600);
    window.dispatchEvent(new Event("resize"));
    setWindowSize(900, 700);
    window.dispatchEvent(new Event("resize"));
    setWindowSize(1000, 800);
    window.dispatchEvent(new Event("resize"));

    vi.advanceTimersByTime(150);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ width: 1000, height: 800 });

    unsubscribe();
  });

  it("deduplicates identical consecutive dimensions", () => {
    vi.useFakeTimers();
    const handler = vi.fn();
    const unsubscribe = subscribeResize(handler);

    setWindowSize(1024, 768);
    window.dispatchEvent(new Event("resize"));
    vi.advanceTimersByTime(150);

    // Same dimensions again — should not emit a second time.
    window.dispatchEvent(new Event("resize"));
    vi.advanceTimersByTime(150);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ width: 1024, height: 768 });

    unsubscribe();
  });

  it("stops emitting after unsubscribe", () => {
    vi.useFakeTimers();
    const handler = vi.fn();
    const unsubscribe = subscribeResize(handler);

    unsubscribe();

    setWindowSize(500, 500);
    window.dispatchEvent(new Event("resize"));
    vi.advanceTimersByTime(150);

    expect(handler).not.toHaveBeenCalled();
  });
});
