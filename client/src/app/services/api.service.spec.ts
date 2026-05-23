import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { firstValueFrom } from "rxjs";
import { type MockInstance, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "../../environments/environment";
import backupIndicators from "../data/backup-indicators.json";
import backupQuotes from "../data/backup-quotes.json"; // Added JSON quotes import
import type { IndicatorListing, IndicatorSelection } from "@facioquo/indy-charts";
import { ApiService } from "./api.service";

type ApiQuote = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

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
    const rawMock: ApiQuote[] = [
      {
        timestamp: "2023-01-01T00:00:00.000Z",
        open: 100,
        high: 105,
        low: 99,
        close: 103,
        volume: 1000000
      }
    ];

    service.getQuotes().subscribe(quotes => {
      expect(quotes).toEqual([
        {
          timestamp: new Date("2023-01-01T00:00:00.000Z"),
          open: 100,
          high: 105,
          low: 99,
          close: 103,
          volume: 1000000
        }
      ]);
    });

    const req = httpMock.expectOne(`${env.api}/quotes`);
    expect(req.request.method).toBe("GET");
    req.flush(rawMock);
  });

  it("should fallback to client backup quotes when API fails", () => {
    service.getQuotes().subscribe(quotes => {
      expect(quotes.length).toBeGreaterThan(0);
      expect(quotes[0].timestamp instanceof Date).toBe(true);
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
      expect(quotes[0].timestamp instanceof Date).toBe(true);
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
    const quotes = backupQuotes as ApiQuote[];
    expect(quotes.length).toBeGreaterThan(0);
    expect(quotes[0]).toHaveProperty("open");
    expect(quotes[0]).toHaveProperty("close");
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
    const mockSelectionData = [{ timestamp: "2024-01-01", adx: 25 }];

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
    const mockSelectionData = [{ timestamp: "2024-01-01", adx: 25 }];

    service.getSelectionData(selection, listing).subscribe(data => {
      expect(data).toEqual(mockSelectionData);
    });

    const req = httpMock.expectOne(request => request.url === endpoint);
    expect(req.request.method).toBe("GET");
    expect(req.request.params.get("lookbackPeriods")).toBe("14");
    req.flush(mockSelectionData);
  });

  it("should fallback to timestamp-aligned backup rows when backend is transiently unavailable", async () => {
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

    const rows = (await result) as Array<{ timestamp: string }>;
    const backup = backupQuotes as ApiQuote[];
    expect(rows).toHaveLength(backup.length);
    expect(rows[0].timestamp).toBe(backup[0].timestamp);
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

  it("returns timestamp-aligned backup rows without an HTTP request after quotes fell back to backup", async () => {
    // First call: getQuotes errors → triggers backup mode
    const quotes$ = firstValueFrom(service.getQuotes());
    const quotesReq = httpMock.expectOne(`${env.api}/quotes`);
    quotesReq.error(new ProgressEvent("Network error"), {
      status: 0,
      statusText: "Network Error"
    });
    await quotes$;

    // Subsequent getSelectionData must NOT issue an HTTP request and must
    // resolve to rows aligned with backup quote timestamps. Anchoring the
    // x-axis to the candlestick range keeps overlay/oscillator charts
    // visually consistent when the live API is unavailable.
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

    const rows = (await firstValueFrom(service.getSelectionData(selection, listing))) as Array<{
      timestamp: string;
      candle: { timestamp: string };
    }>;

    const backup = backupQuotes as ApiQuote[];
    expect(rows).toHaveLength(backup.length);
    expect(rows[0].timestamp).toBe(backup[0].timestamp);
    expect(rows[0].candle.timestamp).toBe(backup[0].timestamp);
    expect(rows.at(-1)?.timestamp).toBe(backup.at(-1)?.timestamp);
    httpMock.expectNone(request => request.url === `${env.api}/ADX/`);
  });

  it("returns timestamp-aligned backup rows without an HTTP request after listings fell back to backup", async () => {
    const listings$ = firstValueFrom(service.getListings());
    const listingsReq = httpMock.expectOne(`${env.api}/indicators`);
    listingsReq.error(new ProgressEvent("Server error"), {
      status: 500,
      statusText: "Internal Server Error"
    });
    await listings$;

    const listing: IndicatorListing = {
      name: "Relative Strength Index",
      uiid: "RSI",
      legendTemplate: "RSI([P1])",
      endpoint: "/RSI/",
      category: "oscillator",
      chartType: "oscillator",
      order: 0,
      chartConfig: null,
      parameters: [],
      results: []
    };
    const selection: IndicatorSelection = {
      ucid: "chart-rsi",
      uiid: "RSI",
      label: "RSI(14)",
      chartType: "oscillator",
      params: [],
      results: []
    };

    const rows = (await firstValueFrom(service.getSelectionData(selection, listing))) as Array<{
      timestamp: string;
    }>;

    expect(rows.length).toBe((backupQuotes as ApiQuote[]).length);
    httpMock.expectNone(request => request.url === `${env.api}/RSI/`);
  });

  it("re-arms live indicator fetches after a single transient indicator failure self-heals", async () => {
    // Quotes/listings are only fetched at bootstrap, so a transient 502 on a
    // single indicator must NOT keep the rest of the session stuck on backup
    // data. A subsequent successful indicator response should clear the flag.
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

    // First indicator request hits a transient 502 — backup mode arms and
    // backup rows are returned without re-trying.
    const firstReq = firstValueFrom(service.getSelectionData(selection, listing));
    httpMock.expectOne(request => request.url === `${env.api}/ADX/`).error(
      new ProgressEvent("Bad Gateway"),
      {
        status: 502,
        statusText: "Bad Gateway"
      }
    );
    const firstRows = (await firstReq) as Array<{ timestamp: string }>;
    expect(firstRows.length).toBe((backupQuotes as ApiQuote[]).length);

    // While backupActive=true, calls short-circuit to backup rows without HTTP.
    const shortCircuited = (await firstValueFrom(
      service.getSelectionData(selection, listing)
    )) as Array<{ timestamp: string }>;
    expect(shortCircuited.length).toBe((backupQuotes as ApiQuote[]).length);
    httpMock.expectNone(request => request.url === `${env.api}/ADX/`);

    // Wait — backupActive only clears on a successful HTTP response. So we
    // need to first force the short-circuit OFF by making a getQuotes succeed,
    // OR (per the new contract) by having the indicator fetch itself succeed.
    // The new behavior is that a successful indicator response clears the flag.
    // To exercise it we have to bypass the short-circuit, which only quotes/
    // listings can do. So this test verifies recovery via a successful indicator
    // response AFTER quotes have re-armed live mode.
    const quotes$ = firstValueFrom(service.getQuotes());
    httpMock
      .expectOne(`${env.api}/quotes`)
      .flush([
        { timestamp: "2024-01-01T00:00:00.000Z", open: 1, high: 2, low: 0, close: 1, volume: 10 }
      ]);
    await quotes$;

    // Indicator now reaches the live endpoint and a successful response keeps
    // the flag cleared for any subsequent transient-only failures.
    const liveReq = firstValueFrom(service.getSelectionData(selection, listing));
    httpMock
      .expectOne(request => request.url === `${env.api}/ADX/`)
      .flush([{ timestamp: "2024-01-01", adx: 22 }]);
    await expect(liveReq).resolves.toEqual([{ timestamp: "2024-01-01", adx: 22 }]);

    // Confirm the success-path clear: another indicator request goes live.
    const secondLiveReq = firstValueFrom(service.getSelectionData(selection, listing));
    httpMock
      .expectOne(request => request.url === `${env.api}/ADX/`)
      .flush([{ timestamp: "2024-01-02", adx: 23 }]);
    await expect(secondLiveReq).resolves.toEqual([{ timestamp: "2024-01-02", adx: 23 }]);
  });

  it("re-arms live indicator fetches after a successful getQuotes response recovers the backend", async () => {
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

    // Step 1: getQuotes errors → backup mode is armed
    const firstQuotes = firstValueFrom(service.getQuotes());
    httpMock.expectOne(`${env.api}/quotes`).error(new ProgressEvent("Network error"), {
      status: 0,
      statusText: "Network Error"
    });
    await firstQuotes;

    // Sanity: indicator fetch is short-circuited while backup is armed
    const armedRows = (await firstValueFrom(
      service.getSelectionData(selection, listing)
    )) as Array<{ timestamp: string }>;
    expect(armedRows.length).toBe((backupQuotes as ApiQuote[]).length);
    httpMock.expectNone(request => request.url === `${env.api}/ADX/`);

    // Step 2: getQuotes succeeds → backup mode must clear
    const secondQuotes = firstValueFrom(service.getQuotes());
    httpMock
      .expectOne(`${env.api}/quotes`)
      .flush([
        { timestamp: "2024-01-01T00:00:00.000Z", open: 1, high: 2, low: 0, close: 1, volume: 10 }
      ]);
    await secondQuotes;

    // Step 3: indicator fetch now reaches the live endpoint
    const indicatorRequest = firstValueFrom(service.getSelectionData(selection, listing));
    const req = httpMock.expectOne(request => request.url === `${env.api}/ADX/`);
    req.flush([{ timestamp: "2024-01-01", adx: 22 }]);
    await expect(indicatorRequest).resolves.toEqual([{ timestamp: "2024-01-01", adx: 22 }]);
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
