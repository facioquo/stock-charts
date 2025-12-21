import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { MockInstance, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "../../environments/environment";
import backupQuotes from "../data/backup-quotes.json"; // Added JSON quotes import
import { RawQuote } from "../pages/chart/chart.models";
import { ApiService } from "./api.service";

describe("ApiService", () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  let consoleWarnSpy: MockInstance;

  beforeEach(() => {
    // Spy on console.warn to prevent noise in test output
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    // Restore console.warn
    consoleWarnSpy.mockRestore();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return quotes from API when available", () => {
    const mockQuotes = [
      { date: new Date("2023-01-01"), open: 100, high: 105, low: 99, close: 103, volume: 1000000 }
    ];

    service.getQuotes().subscribe(quotes => {
      expect(quotes).toEqual(mockQuotes);
    });

    const req = httpMock.expectOne(`${env.api}/quotes`);
    expect(req.request.method).toBe("GET");
    req.flush(mockQuotes);
  });

  it("should fallback to client backup quotes when API fails", () => {
    service.getQuotes().subscribe(quotes => {
      expect(quotes.length).toBeGreaterThan(0);
      expect(quotes[0].date instanceof Date).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Backend API unavailable, using client-side backup quotes",
        expect.any(Object)
      );
    });

    const req = httpMock.expectOne(`${env.api}/quotes`);
    expect(req.request.method).toBe("GET");

    // Simulate API failure
    req.error(new ProgressEvent("Network error"), {
      status: 0,
      statusText: "Network Error"
    });
  });

  it("should fallback to client backup quotes when API returns server error", () => {
    service.getQuotes().subscribe(quotes => {
      expect(quotes.length).toBeGreaterThan(0);
      expect(quotes[0].date instanceof Date).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Backend API unavailable, using client-side backup quotes",
        expect.any(Object)
      );
    });

    const req = httpMock.expectOne(`${env.api}/quotes`);
    expect(req.request.method).toBe("GET");

    // Simulate server error
    req.error(new ProgressEvent("Server error"), {
      status: 500,
      statusText: "Internal Server Error"
    });
  });

  it("client backup quotes should have realistic data structure", () => {
    const quotes = backupQuotes as RawQuote[];
    expect(quotes.length).toBeGreaterThanOrEqual(0);
  });

  it("should return indicators from API when available", () => {
    const mockIndicators = [
      {
        name: "Test Indicator",
        uiid: "TEST",
        legendTemplate: "TEST([P1])",
        endpoint: "/TEST/",
        category: "test",
        chartType: "overlay",
        order: 0,
        chartConfig: null,
        parameters: [],
        results: []
      }
    ];

    service.getListings().subscribe(indicators => {
      expect(indicators).toEqual(mockIndicators);
    });

    const req = httpMock.expectOne(`${env.api}/indicators`);
    expect(req.request.method).toBe("GET");
    req.flush(mockIndicators);
  });

  describe("getSelectionData", () => {
    it("should convert relative endpoint URLs to absolute URLs", () => {
      const selection = {
        ucid: "test-ucid",
        uiid: "ADX",
        label: "ADX(14)",
        chartType: "oscillator",
        params: [
          {
            paramName: "lookbackPeriods",
            displayName: "Lookback",
            minimum: 2,
            maximum: 250,
            value: 14
          }
        ],
        results: []
      };

      const listing = {
        name: "ADX",
        uiid: "ADX",
        legendTemplate: "ADX([P1])",
        endpoint: "/ADX/", // Relative path
        category: "test",
        chartType: "oscillator",
        order: 0,
        chartConfig: null,
        parameters: [],
        results: []
      };

      const mockData = [{ date: "2023-01-01", adx: 25 }];

      service.getSelectionData(selection, listing).subscribe(data => {
        expect(data).toEqual(mockData);
      });

      // Should request from absolute URL (env.api + relative path)
      const req = httpMock.expectOne(`${env.api}/ADX/?lookbackPeriods=14`);
      expect(req.request.method).toBe("GET");
      req.flush(mockData);
    });

    it("should handle absolute endpoint URLs without modification", () => {
      const selection = {
        ucid: "test-ucid",
        uiid: "ADX",
        label: "ADX(14)",
        chartType: "oscillator",
        params: [
          {
            paramName: "lookbackPeriods",
            displayName: "Lookback",
            minimum: 2,
            maximum: 250,
            value: 14
          }
        ],
        results: []
      };

      const listing = {
        name: "ADX",
        uiid: "ADX",
        legendTemplate: "ADX([P1])",
        endpoint: "https://api.example.com/ADX/", // Absolute URL
        category: "test",
        chartType: "oscillator",
        order: 0,
        chartConfig: null,
        parameters: [],
        results: []
      };

      const mockData = [{ date: "2023-01-01", adx: 25 }];

      service.getSelectionData(selection, listing).subscribe(data => {
        expect(data).toEqual(mockData);
      });

      // Should request from the absolute URL as-is
      const req = httpMock.expectOne("https://api.example.com/ADX/?lookbackPeriods=14");
      expect(req.request.method).toBe("GET");
      req.flush(mockData);
    });

    it("should include query parameters in the request", () => {
      const selection = {
        ucid: "test-ucid",
        uiid: "BB",
        label: "BB(20,2)",
        chartType: "overlay",
        params: [
          {
            paramName: "lookbackPeriods",
            displayName: "Lookback",
            minimum: 2,
            maximum: 250,
            value: 20
          },
          {
            paramName: "standardDeviations",
            displayName: "Std Dev",
            minimum: 1,
            maximum: 10,
            value: 2
          }
        ],
        results: []
      };

      const listing = {
        name: "Bollinger Bands",
        uiid: "BB",
        legendTemplate: "BB([P1],[P2])",
        endpoint: "/BB/",
        category: "test",
        chartType: "overlay",
        order: 0,
        chartConfig: null,
        parameters: [],
        results: []
      };

      const mockData = [{ date: "2023-01-01", upper: 105, middle: 100, lower: 95 }];

      service.getSelectionData(selection, listing).subscribe(data => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(`${env.api}/BB/?lookbackPeriods=20&standardDeviations=2`);
      expect(req.request.method).toBe("GET");
      expect(req.request.params.get("lookbackPeriods")).toBe("20");
      expect(req.request.params.get("standardDeviations")).toBe("2");
      req.flush(mockData);
    });
  });
});
