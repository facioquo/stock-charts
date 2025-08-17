/**
 * Observer mocks with controllable trigger APIs for testing
 * Part of issue #414 - Hardening Chart Testing Strategy
 */

export interface MockResizeObserver {
  observe: jest.Mock;
  unobserve: jest.Mock;
  disconnect: jest.Mock;
  triggerResize: (entries: ResizeObserverEntry[]) => void;
}

export interface MockIntersectionObserver {
  observe: jest.Mock;
  unobserve: jest.Mock;
  disconnect: jest.Mock;
  triggerIntersect: (entries: IntersectionObserverEntry[]) => void;
}

/**
 * Create a mock ResizeObserver with controllable trigger
 */
export function createMockResizeObserver(): MockResizeObserver {
  let callback: ResizeObserverCallback | null = null;

  const mockObserver: MockResizeObserver = {
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    triggerResize: (entries: ResizeObserverEntry[]) => {
      if (callback) {
        callback(entries, mockObserver as unknown as ResizeObserver);
      }
    }
  };

  // Augment global ResizeObserver constructor with a typed jest mock
  globalThis.ResizeObserver = jest.fn<ResizeObserver, [ResizeObserverCallback]>(
    (cb: ResizeObserverCallback) => {
      callback = cb;
      return mockObserver as unknown as ResizeObserver;
    }
  ) as unknown as typeof globalThis.ResizeObserver;

  return mockObserver;
}

/**
 * Create a mock IntersectionObserver with controllable trigger
 */
export function createMockIntersectionObserver(): MockIntersectionObserver {
  let callback: IntersectionObserverCallback | null = null;

  const mockObserver: MockIntersectionObserver = {
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    triggerIntersect: (entries: IntersectionObserverEntry[]) => {
      if (callback) {
        callback(entries, mockObserver as unknown as IntersectionObserver);
      }
    }
  };

  // Augment global IntersectionObserver constructor with a typed jest mock
  globalThis.IntersectionObserver = jest.fn<IntersectionObserver, [IntersectionObserverCallback]>(
    (cb: IntersectionObserverCallback) => {
      callback = cb;
      return mockObserver as unknown as IntersectionObserver;
    }
  ) as unknown as typeof globalThis.IntersectionObserver;

  return mockObserver;
}

/**
 * Mock ResizeObserverEntry for testing
 */
export function createMockResizeObserverEntry(
  target: Element,
  contentRect: DOMRectReadOnly
): ResizeObserverEntry {
  return {
    target,
    contentRect,
    borderBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
    contentBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
    devicePixelContentBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>
  };
}

/**
 * Mock IntersectionObserverEntry for testing
 */
export function createMockIntersectionObserverEntry(
  target: Element,
  isIntersecting: boolean = true,
  intersectionRatio: number = 1.0
): IntersectionObserverEntry {
  const rect = target.getBoundingClientRect();

  return {
    target,
    isIntersecting,
    intersectionRatio,
    time: Date.now(),
    boundingClientRect: rect,
    intersectionRect: rect,
    rootBounds: rect
  };
}

/**
 * Reset all observer mocks
 */
export function resetObserverMocks(): void {
  Reflect.deleteProperty(globalThis, "ResizeObserver");
  Reflect.deleteProperty(globalThis, "IntersectionObserver");
}

// Global constructor augmentation declarations (test env only)
// Provide typed augmentation for jest mocked constructors without changing existing lib types.
// We declare them as already existing (from DOM lib) so no redeclaration with incompatible shape occurs.
// If running in a Node + jsdom environment they are present; if not, tests will assign them dynamically.
export {}; // ensure this file is a module to contain the global augmentation
