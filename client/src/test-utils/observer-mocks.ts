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

  const mockObserver = {
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    triggerResize: (entries: ResizeObserverEntry[]) => {
      if (callback) {
        callback(entries, mockObserver as any);
      }
    }
  };

  // Mock the constructor
  (global as any).ResizeObserver = jest.fn().mockImplementation((cb: ResizeObserverCallback) => {
    callback = cb;
    return mockObserver;
  });

  return mockObserver;
}

/**
 * Create a mock IntersectionObserver with controllable trigger
 */
export function createMockIntersectionObserver(): MockIntersectionObserver {
  let callback: IntersectionObserverCallback | null = null;

  const mockObserver = {
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    triggerIntersect: (entries: IntersectionObserverEntry[]) => {
      if (callback) {
        callback(entries, mockObserver as any);
      }
    }
  };

  // Mock the constructor
  (global as any).IntersectionObserver = jest
    .fn()
    .mockImplementation((cb: IntersectionObserverCallback) => {
      callback = cb;
      return mockObserver;
    });

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
    borderBoxSize: [] as any,
    contentBoxSize: [] as any,
    devicePixelContentBoxSize: [] as any
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
  delete (global as any).ResizeObserver;
  delete (global as any).IntersectionObserver;
}
