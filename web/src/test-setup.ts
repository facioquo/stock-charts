import "@testing-library/jest-dom/vitest";

// jsdom lacks the layout APIs Primer's overlays and responsive hooks call; these
// stand-ins report no media match and no size changes.
if (typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false
  });
}

// Primer's tooltips use the popover API; without it they load a polyfill that
// jsdom cannot run. These make the API present and inert.
const elementPrototypeHtml = HTMLElement.prototype;
if (!Reflect.has(elementPrototypeHtml, "popover")) {
  Object.defineProperty(elementPrototypeHtml, "popover", {
    configurable: true,
    writable: true,
    value: null
  });
  elementPrototypeHtml.showPopover = () => undefined;
  elementPrototypeHtml.hidePopover = () => undefined;
  elementPrototypeHtml.togglePopover = () => false;
}

if (typeof globalThis.ResizeObserver !== "function") {
  globalThis.ResizeObserver = class {
    observe = (): undefined => undefined;
    unobserve = (): undefined => undefined;
    disconnect = (): undefined => undefined;
  };
}
