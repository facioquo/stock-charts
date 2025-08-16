import { TestBed } from "@angular/core/testing";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { ApiService } from "./api.service";
import { CLIENT_BACKUP_QUOTES } from "../data/backup-quotes";
import { CLIENT_BACKUP_INDICATORS } from "../data/backup-indicators";
import { env } from "../../environments/environment";

describe("ApiService", () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on console.warn to prevent noise in test output
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

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
      expect(quotes).toEqual(CLIENT_BACKUP_QUOTES);
      expect(quotes.length).toBe(1000); // Verify we have exactly 1000 quotes
      // Verify console.warn was called for failover
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
      expect(quotes).toEqual(CLIENT_BACKUP_QUOTES);
      expect(quotes.length).toBe(1000);
      // Verify console.warn was called for failover
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
    expect(CLIENT_BACKUP_QUOTES.length).toBe(1000);

    const firstQuote = CLIENT_BACKUP_QUOTES[0];
    expect(firstQuote).toHaveProperty("date");
    expect(firstQuote).toHaveProperty("open");
    expect(firstQuote).toHaveProperty("high");
    expect(firstQuote).toHaveProperty("low");
    expect(firstQuote).toHaveProperty("close");
    expect(firstQuote).toHaveProperty("volume");

    expect(typeof firstQuote.open).toBe("number");
    expect(typeof firstQuote.high).toBe("number");
    expect(typeof firstQuote.low).toBe("number");
    expect(typeof firstQuote.close).toBe("number");
    expect(typeof firstQuote.volume).toBe("number");

    // Basic validation that high >= low
    expect(firstQuote.high).toBeGreaterThanOrEqual(firstQuote.low);
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
      expect(indicators).toEqual(CLIENT_BACKUP_INDICATORS);
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
      expect(indicators).toEqual(CLIENT_BACKUP_INDICATORS);
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

  it("client backup indicators should have valid data structure", () => {
    expect(CLIENT_BACKUP_INDICATORS.length).toBeGreaterThan(5);

    const firstIndicator = CLIENT_BACKUP_INDICATORS[0];
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

    // Verify we have essential indicators like RSI, MACD, etc.
    const indicatorNames = CLIENT_BACKUP_INDICATORS.map(i => i.uiid);
    expect(indicatorNames).toContain("SMA");
    expect(indicatorNames).toContain("EMA");
    expect(indicatorNames).toContain("RSI");
    expect(indicatorNames).toContain("MACD");
    expect(indicatorNames).toContain("BB");
  });
});
