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
if (!Reflect.has(HTMLElement.prototype, "popover")) {
  // Reflects the attribute, as a browser's does.
  Object.defineProperty(HTMLElement.prototype, "popover", {
    configurable: true,
    get(this: HTMLElement) {
      return this.getAttribute("popover");
    },
    set(this: HTMLElement, value: string | null) {
      if (value === null) this.removeAttribute("popover");
      else this.setAttribute("popover", value);
    }
  });
  HTMLElement.prototype.showPopover = () => undefined;
  HTMLElement.prototype.hidePopover = () => undefined;
  HTMLElement.prototype.togglePopover = () => false;
}

if (typeof globalThis.ResizeObserver !== "function") {
  globalThis.ResizeObserver = class {
    observe = (): undefined => undefined;
    unobserve = (): undefined => undefined;
    disconnect = (): undefined => undefined;
  };
}
