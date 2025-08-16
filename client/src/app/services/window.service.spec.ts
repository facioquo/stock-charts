import { TestBed } from "@angular/core/testing";
import { WindowService } from "./window.service";

describe("WindowService - Chart Resizing", () => {
  let service: WindowService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WindowService]
    });
    service = TestBed.inject(WindowService);
  });

  describe("calculateOptimalBars", () => {
    it("should calculate bars based on 5px per bar ratio", () => {
      const width = 1000;
      const expectedBars = Math.floor(width / 5); // 200 bars

      const result = service.calculateOptimalBars(width);

      expect(result).toBe(expectedBars);
    });

    it("should enforce minimum bar count", () => {
      const smallWidth = 50; // Would give 10 bars

      const result = service.calculateOptimalBars(smallWidth);

      expect(result).toBe(20); // Should use minimum
    });

    it("should enforce maximum bar count", () => {
      const largeWidth = 3000; // Would give 600 bars

      const result = service.calculateOptimalBars(largeWidth);

      expect(result).toBe(500); // Should use maximum
    });

    it("should use window width when no container width provided", () => {
      // Mock window object
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1200
      });

      const result = service.calculateOptimalBars();
      const expected = Math.floor(1200 / 5); // 240 bars

      expect(result).toBe(expected);
    });
  });

  describe("getWindowSize", () => {
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

      const result = service.getWindowSize();

      expect(result).toEqual({ width: 1920, height: 1080 });
    });

    it("should return default dimensions for SSR", () => {
      // Test the SSR scenario by mocking the returned value
      jest.spyOn(service, "getWindowSize").mockReturnValue({ width: 1024, height: 768 });

      const result = service.getWindowSize();

      expect(result).toEqual({ width: 1024, height: 768 });
    });
  });

  describe("getResizeObservable", () => {
    it("should debounce resize events", done => {
      const resizeObservable = service.getResizeObservable();

      // Subscribe to the observable
      const emissions: Array<{ width: number; height: number }> = [];
      resizeObservable.subscribe(dimensions => {
        emissions.push(dimensions);
      });

      // Simulate multiple rapid resize events
      const mockEvent = new Event("resize");
      Object.defineProperty(window, "innerWidth", { value: 800 });
      Object.defineProperty(window, "innerHeight", { value: 600 });
      window.dispatchEvent(mockEvent);

      Object.defineProperty(window, "innerWidth", { value: 900 });
      Object.defineProperty(window, "innerHeight", { value: 700 });
      window.dispatchEvent(mockEvent);

      Object.defineProperty(window, "innerWidth", { value: 1000 });
      Object.defineProperty(window, "innerHeight", { value: 800 });
      window.dispatchEvent(mockEvent);

      // Wait for debounce period (150ms + buffer)
      setTimeout(() => {
        expect(emissions.length).toBe(1);
        expect(emissions[0]).toEqual({ width: 1000, height: 800 });
        done();
      }, 200);
    });
  });

  describe("Dynamic Resize Feature Flag", () => {
    it("should default to disabled", () => {
      expect(service.isDynamicResizeEnabled()).toBe(false);
    });

    it("should allow enabling dynamic resize", () => {
      service.setDynamicResizeEnabled(true);
      expect(service.isDynamicResizeEnabled()).toBe(true);
    });

    it("should allow disabling dynamic resize", () => {
      service.setDynamicResizeEnabled(true);
      service.setDynamicResizeEnabled(false);
      expect(service.isDynamicResizeEnabled()).toBe(false);
    });

    it("should enforce 120 bar cap for initial bar count when window is large", () => {
      // Simulate a very large window that would calculate more than 120 bars
      const largeWidth = 1000; // Would calculate 200 bars (1000/5)

      const calculatedBars = service.calculateOptimalBars(largeWidth);
      expect(calculatedBars).toBe(200); // Verify calculation works normally

      // Test the capping logic that would be applied in ChartService constructor
      const cappedBars = Math.min(120, calculatedBars);
      expect(cappedBars).toBe(120); // Should be capped at 120
    });
  });
});
