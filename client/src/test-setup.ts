import { setupZoneTestEnv } from "jest-preset-angular/setup-env/zone";

// Initialize Angular's Zone.js powered testing environment.
// Required so TestBed async utilities & change detection behave as in a browser.
setupZoneTestEnv();

/**
 * Global Jest + jsdom environment shims.
 * Keep this minimal and well-documented. Each mock exists only to satisfy
 * concrete library expectations (Angular, Angular Material, Chart.js, etc.)
 * and reduce flakiness. All overrides are guarded & idempotent so re-runs
 * (watch mode) do not throw or mask real browser APIs if they become available.
 */

// Some libraries probe for the CSS object; jsdom may not define it.
if (!("CSS" in window)) {
  Object.defineProperty(window, "CSS", { value: null });
}

// Provide a minimal getComputedStyle implementation if absent.
// Must include getPropertyValue for libraries checking transforms or layout.
if (typeof window.getComputedStyle !== "function") {
  Object.defineProperty(window, "getComputedStyle", {
    value: (elt: Element) => ({
      display: "block",
      appearance: ["-webkit-appearance"],
      position: "static",
      getPropertyValue: (prop: string) => {
        if (prop === "transform") {
          return (elt as HTMLElement).style.transform || "none";
        }
        return "";
      }
    })
  });
}

// Ensure a real DocumentType to avoid quirks-mode branches & provide proper interface.
if (!document.doctype) {
  const realDoctype = document.implementation.createDocumentType("html", "", "");
  Object.defineProperty(document, "doctype", { value: realDoctype, configurable: true });
}

// Make body.style.transform writable (some libs set or read it during positioning).
const transformDescriptor = Object.getOwnPropertyDescriptor(document.body.style, "transform");
if (!transformDescriptor || transformDescriptor.writable === false) {
  Object.defineProperty(document.body.style, "transform", {
    value: "",
    writable: true,
    configurable: true
  });
}

// ResizeObserver mock (layout / resize dependent logic, Angular CDK, Chart.js).
if (!("ResizeObserver" in window)) {
  class ResizeObserver {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(private _cb: ResizeObserverCallback) {}
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  (window as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = ResizeObserver;
}

// IntersectionObserver mock (lazy rendering, virtual scroll, sentinel elements).
if (!("IntersectionObserver" in window)) {
  class IntersectionObserver {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(private _cb: IntersectionObserverCallback) {}
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    root: Element | Document | null = null;
    rootMargin = "0px";
    thresholds = [0];
  }
  const typedWindow = window as unknown as {
    IntersectionObserver: typeof IntersectionObserver;
  };
  typedWindow.IntersectionObserver = IntersectionObserver;
}

// matchMedia mock (responsive breakpoints, theming queries).
if (!("matchMedia" in window)) {
  (window as unknown as { matchMedia: (query: string) => MediaQueryList }).matchMedia = (
    query: string
  ) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {}, // deprecated API still probed by some libs
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      }
    }) as MediaQueryList;
}

// Minimal CanvasRenderingContext2D stub for Chart.js or text measuring logic.
if (!HTMLCanvasElement.prototype.getContext) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HTMLCanvasElement.prototype.getContext = function (): any {
    return {
      canvas: this,
      // Extremely naive text width approximation; good enough for layout-less tests.
      measureText: (text: string) => ({ width: text.length * 6 }),
      // Add methods lazily only when they become necessary to keep surface small.
      save() {},
      restore() {},
      beginPath() {},
      closePath() {},
      fill() {},
      stroke() {},
      arc() {},
      fillRect() {},
      clearRect() {},
      fillText() {}
    };
  };
}

// Place any additional, *well-documented* global test shims above this line.
