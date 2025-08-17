import { TestBed } from "@angular/core/testing";
import { MediaQueryService } from "./media-query.service";

describe("MediaQueryService", () => {
  let service: MediaQueryService;
  let mockMatchMedia: jest.Mock;

  beforeEach(() => {
    // Mock window.matchMedia
    mockMatchMedia = jest.fn();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: mockMatchMedia
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(MediaQueryService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("matches", () => {
    it("should return true when media query matches", () => {
      mockMatchMedia.mockReturnValue({ matches: true });

      const result = service.matches("(max-width: 768px)");

      expect(result).toBe(true);
      expect(mockMatchMedia).toHaveBeenCalledWith("(max-width: 768px)");
    });

    it("should return false when media query does not match", () => {
      mockMatchMedia.mockReturnValue({ matches: false });

      const result = service.matches("(max-width: 768px)");

      expect(result).toBe(false);
    });

    it("should return false when matchMedia is not available", () => {
      Object.defineProperty(window, "matchMedia", {
        value: undefined,
        writable: true
      });

      const result = service.matches("(max-width: 768px)");

      expect(result).toBe(false);
    });
  });

  describe("listen", () => {
    it("should call callback with initial matches value", () => {
      const mockMediaQuery = {
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      mockMatchMedia.mockReturnValue(mockMediaQuery);
      const callback = jest.fn();

      service.listen("(max-width: 768px)", callback);

      expect(callback).toHaveBeenCalledWith(true);
    });

    it("should register event listener for changes", () => {
      const mockMediaQuery = {
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      mockMatchMedia.mockReturnValue(mockMediaQuery);
      const callback = jest.fn();

      service.listen("(max-width: 768px)", callback);

      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    });

    it("should return cleanup function that removes event listener", () => {
      const mockMediaQuery = {
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      mockMatchMedia.mockReturnValue(mockMediaQuery);
      const callback = jest.fn();

      const cleanup = service.listen("(max-width: 768px)", callback);
      cleanup();

      expect(mockMediaQuery.removeEventListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function)
      );
    });

    it("should handle media query change events", () => {
      const mockMediaQuery = {
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      mockMatchMedia.mockReturnValue(mockMediaQuery);
      const callback = jest.fn();

      service.listen("(max-width: 768px)", callback);

      // Simulate change event
      const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1];
      changeHandler({ matches: true });

      expect(callback).toHaveBeenCalledWith(true);
    });
  });

  describe("convenience methods", () => {
    it("should detect mobile correctly", () => {
      mockMatchMedia.mockReturnValue({ matches: true });

      const result = service.isMobile();

      expect(result).toBe(true);
      expect(mockMatchMedia).toHaveBeenCalledWith("(max-width: 768px)");
    });

    it("should detect tablet correctly", () => {
      mockMatchMedia.mockReturnValue({ matches: true });

      const result = service.isTablet();

      expect(result).toBe(true);
      expect(mockMatchMedia).toHaveBeenCalledWith("(min-width: 769px) and (max-width: 1024px)");
    });

    it("should detect desktop correctly", () => {
      mockMatchMedia.mockReturnValue({ matches: true });

      const result = service.isDesktop();

      expect(result).toBe(true);
      expect(mockMatchMedia).toHaveBeenCalledWith("(min-width: 1025px)");
    });

    it("should detect dark mode correctly", () => {
      mockMatchMedia.mockReturnValue({ matches: true });

      const result = service.isDarkMode();

      expect(result).toBe(true);
      expect(mockMatchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    });

    it("should detect reduced motion preference correctly", () => {
      mockMatchMedia.mockReturnValue({ matches: true });

      const result = service.prefersReducedMotion();

      expect(result).toBe(true);
      expect(mockMatchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
    });
  });

  describe("multiple media query tests", () => {
    it("should handle different screen sizes", () => {
      // Mock mobile detection
      mockMatchMedia.mockImplementation(query => {
        if (query === "(max-width: 768px)") return { matches: true };
        if (query === "(min-width: 769px) and (max-width: 1024px)") return { matches: false };
        if (query === "(min-width: 1025px)") return { matches: false };
        return { matches: false };
      });

      expect(service.isMobile()).toBe(true);
      expect(service.isTablet()).toBe(false);
      expect(service.isDesktop()).toBe(false);
    });

    it("should handle tablet size correctly", () => {
      // Mock tablet detection
      mockMatchMedia.mockImplementation(query => {
        if (query === "(max-width: 768px)") return { matches: false };
        if (query === "(min-width: 769px) and (max-width: 1024px)") return { matches: true };
        if (query === "(min-width: 1025px)") return { matches: false };
        return { matches: false };
      });

      expect(service.isMobile()).toBe(false);
      expect(service.isTablet()).toBe(true);
      expect(service.isDesktop()).toBe(false);
    });
  });
});
