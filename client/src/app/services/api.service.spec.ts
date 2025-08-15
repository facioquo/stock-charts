import { TestBed } from "@angular/core/testing";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { ApiService } from "./api.service";
import { CLIENT_BACKUP_QUOTES } from "../data/backup-quotes";
import { env } from "../../environments/environment";

describe("ApiService", () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
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
      expect(quotes.length).toBeGreaterThan(1000); // Verify we have 1000+ quotes
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
      expect(quotes.length).toBeGreaterThan(1000);
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
    expect(CLIENT_BACKUP_QUOTES.length).toBeGreaterThan(1000);
    
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
});