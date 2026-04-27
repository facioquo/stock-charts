import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { firstValueFrom } from "rxjs";
import { MockInstance, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "../../environments/environment";
import backupIndicators from "../data/backup-indicators.json";
import backupQuotes from "../data/backup-quotes.json"; // Added JSON quotes import
import type { IndicatorListing, IndicatorSelection, RawQuote } from "@facioquo/indy-charts";
import { ApiService } from "./api.service";

const BACKUP_INDICATORS = backupIndicators as IndicatorListing[];

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

  it("should fallback to client backup indicators when API fails", () => {
    service.getListings().subscribe(indicators => {
      expect(indicators).toEqual(BACKUP_INDICATORS);
      expect(indicators.length).toBeGreaterThan(5); // Verify we have multiple indicators
      // Verify console.warn was called for failover
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Backend API unavailable, using client-side backup indicators",
        expect.any(Object)
      );
    });

    const req = httpMock.expectOne(`${env.api}/indicators`);
    expect(req.request.method).toBe("GET");

    // Simulate API failure
    req.error(new ProgressEvent("Network error"), {
      status: 0,
      statusText: "Unknown Error"
    });
  });

  it("should fallback to client backup indicators when API returns server error", () => {
    service.getListings().subscribe(indicators => {
      expect(indicators).toEqual(BACKUP_INDICATORS);
      expect(indicators.length).toBeGreaterThan(5);
      // Verify console.warn was called for failover
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Backend API unavailable, using client-side backup indicators",
        expect.any(Object)
      );
    });

    const req = httpMock.expectOne(`${env.api}/indicators`);
    expect(req.request.method).toBe("GET");

    // Simulate server error
    req.error(new ProgressEvent("Server error"), {
      status: 500,
      statusText: "Internal Server Error"
    });
  });

  it("should request selection data from a root-relative endpoint against the API base URL", () => {
    const listing: IndicatorListing = {
      name: "Average Directional Index",
      uiid: "ADX",
      legendTemplate: "ADX([P1])",
      endpoint: "/ADX/",
      category: "trend",
      chartType: "oscillator",
      order: 0,
      chartConfig: null,
      parameters: [],
      results: []
    };
    const selection: IndicatorSelection = {
      ucid: "chart-1",
      uiid: "ADX",
      label: "ADX(14)",
      chartType: "oscillator",
      params: [
        {
          paramName: "lookbackPeriods",
          displayName: "Lookback Periods",
          minimum: 2,
          maximum: 250,
          value: 14
        }
      ],
      results: []
    };
    const mockSelectionData = [{ date: "2024-01-01", adx: 25 }];

    service.getSelectionData(selection, listing).subscribe(data => {
      expect(data).toEqual(mockSelectionData);
    });

    const req = httpMock.expectOne(request => request.url === `${env.api}/ADX/`);
    expect(req.request.method).toBe("GET");
    expect(req.request.headers.get("Accept")).toBe("application/json");
    expect(req.request.params.get("lookbackPeriods")).toBe("14");
    req.flush(mockSelectionData);
  });

  it("should preserve absolute selection data endpoints from server listings", () => {
    const endpoint = "https://stock-charts-api.example.test/ADX/";
    const listing: IndicatorListing = {
      name: "Average Directional Index",
      uiid: "ADX",
      legendTemplate: "ADX([P1])",
      endpoint,
      category: "trend",
      chartType: "oscillator",
      order: 0,
      chartConfig: null,
      parameters: [],
      results: []
    };
    const selection: IndicatorSelection = {
      ucid: "chart-1",
      uiid: "ADX",
      label: "ADX(14)",
      chartType: "oscillator",
      params: [
        {
          paramName: "lookbackPeriods",
          displayName: "Lookback Periods",
          minimum: 2,
          maximum: 250,
          value: 14
        }
      ],
      results: []
    };
    const mockSelectionData = [{ date: "2024-01-01", adx: 25 }];

    service.getSelectionData(selection, listing).subscribe(data => {
      expect(data).toEqual(mockSelectionData);
    });

    const req = httpMock.expectOne(request => request.url === endpoint);
    expect(req.request.method).toBe("GET");
    expect(req.request.params.get("lookbackPeriods")).toBe("14");
    req.flush(mockSelectionData);
  });

  it("should fallback to empty selection data only when backend is unavailable", async () => {
    const listing: IndicatorListing = {
      name: "Average Directional Index",
      uiid: "ADX",
      legendTemplate: "ADX([P1])",
      endpoint: "/ADX/",
      category: "trend",
      chartType: "oscillator",
      order: 0,
      chartConfig: null,
      parameters: [],
      results: []
    };
    const selection: IndicatorSelection = {
      ucid: "chart-1",
      uiid: "ADX",
      label: "ADX(14)",
      chartType: "oscillator",
      params: [],
      results: []
    };

    const result = firstValueFrom(service.getSelectionData(selection, listing));
    const req = httpMock.expectOne(request => request.url === `${env.api}/ADX/`);
    req.error(new ProgressEvent("Network error"), {
      status: 0,
      statusText: "Unknown Error"
    });

    await expect(result).resolves.toEqual([]);
  });

  it("should rethrow selection data contract failures instead of returning no data", async () => {
    const listing: IndicatorListing = {
      name: "Average Directional Index",
      uiid: "ADX",
      legendTemplate: "ADX([P1])",
      endpoint: "/ADX/",
      category: "trend",
      chartType: "oscillator",
      order: 0,
      chartConfig: null,
      parameters: [],
      results: []
    };
    const selection: IndicatorSelection = {
      ucid: "chart-1",
      uiid: "ADX",
      label: "ADX(14)",
      chartType: "oscillator",
      params: [],
      results: []
    };

    const result = firstValueFrom(service.getSelectionData(selection, listing));
    const req = httpMock.expectOne(request => request.url === `${env.api}/ADX/`);
    req.error(new ProgressEvent("Bad request"), {
      status: 400,
      statusText: "Bad Request"
    });

    await expect(result).rejects.toMatchObject({ status: 400 });
  });

  it("client backup indicators should have valid data structure", () => {
    expect(BACKUP_INDICATORS.length).toBeGreaterThan(5);
    const firstIndicator = BACKUP_INDICATORS[0];
    expect(firstIndicator).toHaveProperty("name");
    expect(firstIndicator).toHaveProperty("uiid");
    expect(firstIndicator).toHaveProperty("legendTemplate");
    expect(firstIndicator).toHaveProperty("endpoint");
    expect(firstIndicator).toHaveProperty("category");
    expect(firstIndicator).toHaveProperty("chartType");
    expect(firstIndicator).toHaveProperty("parameters");
    expect(firstIndicator).toHaveProperty("results");
    expect(typeof firstIndicator.name).toBe("string");
    expect(typeof firstIndicator.uiid).toBe("string");
    expect(Array.isArray(firstIndicator.parameters)).toBe(true);
    expect(Array.isArray(firstIndicator.results)).toBe(true);
    const indicatorNames = BACKUP_INDICATORS.map(i => i.uiid);
    expect(indicatorNames).toContain("SMA");
    expect(indicatorNames).toContain("EMA");
    expect(indicatorNames).toContain("RSI");
    expect(indicatorNames).toContain("MACD");
    expect(indicatorNames).toContain("BB");
  });
});
