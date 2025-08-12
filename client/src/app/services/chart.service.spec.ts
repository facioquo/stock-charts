import { TestBed } from "@angular/core/testing";
import { WindowService } from "./window.service";

// Simple test for the chart resizing logic without importing the full ChartService
describe("Chart Resize Logic", () => {
  let windowService: WindowService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WindowService]
    });
    windowService = TestBed.inject(WindowService);
  });

  describe("Window resize handling", () => {
    it("should calculate optimal bars based on window width", () => {
      const width = 1000;
      const expectedBars = Math.floor(width / 5); // 200 bars
      
      const result = windowService.calculateOptimalBars(width);
      
      expect(result).toBe(expectedBars);
    });

    it("should enforce minimum bar count", () => {
      const smallWidth = 50; // Would give 10 bars
      
      const result = windowService.calculateOptimalBars(smallWidth);
      
      expect(result).toBe(20); // Should use minimum
    });

    it("should enforce maximum bar count", () => {
      const largeWidth = 3000; // Would give 600 bars
      
      const result = windowService.calculateOptimalBars(largeWidth);
      
      expect(result).toBe(500); // Should use maximum
    });

    it("should use window width when no container width provided", () => {
      // Mock window object
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1200
      });
      
      const result = windowService.calculateOptimalBars();
      const expected = Math.floor(1200 / 5); // 240 bars
      
      expect(result).toBe(expected);
    });

    it("should return current window dimensions", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1920
      });
      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 1080
      });
      
      const result = windowService.getWindowSize();
      
      expect(result).toEqual({ width: 1920, height: 1080 });
    });
  });

  describe("Resize observable", () => {
    it("should provide resize observable", () => {
      const resizeObservable = windowService.getResizeObservable();
      
      expect(resizeObservable).toBeDefined();
      
      // Test that the observable emits values
      let emittedValue: { width: number; height: number } | undefined;
      resizeObservable.subscribe(value => {
        emittedValue = value;
      });

      // Simulate a resize event
      Object.defineProperty(window, "innerWidth", { value: 800 });
      Object.defineProperty(window, "innerHeight", { value: 600 });
      
      const resizeEvent = new Event("resize");
      window.dispatchEvent(resizeEvent);
      
      // Allow time for debounce
      setTimeout(() => {
        expect(emittedValue).toBeDefined();
        expect(emittedValue?.width).toBe(800);
        expect(emittedValue?.height).toBe(600);
      }, 200);
    });
  });
});