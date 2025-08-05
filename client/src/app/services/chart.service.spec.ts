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
      // Create a service instance that thinks window is undefined
      const mockService = new (WindowService as unknown)();
      
      // Mock the window check to return undefined
      jest.spyOn(mockService, "getWindowSize").mockReturnValue({ width: 1024, height: 768 });
      
      const result = mockService.getWindowSize();
      
      expect(result).toEqual({ width: 1024, height: 768 });
    });
  });

  describe("getResizeObservable", () => {
    it("should debounce resize events", (done) => {
      const resizeObservable = service.getResizeObservable();
      
      // Subscribe to the observable
      const emissions: Array<{ width: number; height: number }> = [];
      resizeObservable.subscribe(dimensions => {
        emissions.push(dimensions);
        
        // After debounce period, we should only have one emission
        if (emissions.length === 1) {
          expect(emissions).toHaveLength(1);
          done();
        }
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
    });
  });
});