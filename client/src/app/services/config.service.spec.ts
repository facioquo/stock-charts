import { TestBed } from "@angular/core/testing";
import { ChartConfigService } from "./config.service";
import { UserService } from "./user.service";

class MockUserService {
  settings = {
    showTooltips: true,
    isDarkTheme: true
  } as UserService["settings"];
}

describe("ChartConfigService", () => {
  let service: ChartConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChartConfigService, { provide: UserService, useClass: MockUserService }]
    });
    service = TestBed.inject(ChartConfigService);
  });

  it("should configure overlay chart using candlestick chart type", () => {
    const cfg = service.baseOverlayConfig(100);
    expect(cfg.type).toBe("candlestick");
  });
});
