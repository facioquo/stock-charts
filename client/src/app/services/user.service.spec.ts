import { TestBed } from "@angular/core/testing";
import { UserService } from "./user.service";

describe("UserService", () => {
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserService);
    
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset document body classes
    document.body.className = "";
  });

  afterEach(() => {
    localStorage.clear();
    document.body.className = "";
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("loadSettings", () => {
    it("should set default settings when no cached settings exist", () => {
      service.loadSettings();

      expect(service.settings).toEqual({
        isDarkTheme: true,
        showTooltips: false
      });
      expect(localStorage.getItem("settings")).toBeTruthy();
    });

    it("should load cached settings when they exist", () => {
      const cachedSettings = {
        isDarkTheme: false,
        showTooltips: true
      };
      localStorage.setItem("settings", JSON.stringify(cachedSettings));

      service.loadSettings();

      expect(service.settings).toEqual(cachedSettings);
    });

    it("should apply theme on load", () => {
      const cachedSettings = {
        isDarkTheme: false,
        showTooltips: true
      };
      localStorage.setItem("settings", JSON.stringify(cachedSettings));

      service.loadSettings();

      expect(document.body.classList.contains("light-theme")).toBe(true);
      expect(document.body.classList.contains("dark-theme")).toBe(false);
    });
  });

  describe("cacheSettings", () => {
    it("should store settings in localStorage", () => {
      service.settings = {
        isDarkTheme: true,
        showTooltips: false
      };

      service.cacheSettings();

      const cached = localStorage.getItem("settings");
      expect(cached).toBeTruthy();
      expect(JSON.parse(cached!)).toEqual(service.settings);
    });
  });

  describe("changeTheme", () => {
    beforeEach(() => {
      service.settings = {
        isDarkTheme: true,
        showTooltips: false
      };
    });

    it("should apply dark theme", () => {
      service.changeTheme(true);

      expect(service.settings.isDarkTheme).toBe(true);
      expect(document.body.classList.contains("dark-theme")).toBe(true);
      expect(document.body.classList.contains("light-theme")).toBe(false);
    });

    it("should apply light theme", () => {
      service.changeTheme(false);

      expect(service.settings.isDarkTheme).toBe(false);
      expect(document.body.classList.contains("light-theme")).toBe(true);
      expect(document.body.classList.contains("dark-theme")).toBe(false);
    });

    it("should remove previous theme class when switching", () => {
      document.body.classList.add("dark-theme");
      
      service.changeTheme(false);

      expect(document.body.classList.contains("light-theme")).toBe(true);
      expect(document.body.classList.contains("dark-theme")).toBe(false);
    });

    it("should cache settings after theme change", () => {
      jest.spyOn(service, "cacheSettings");
      
      service.changeTheme(false);

      expect(service.cacheSettings).toHaveBeenCalled();
    });
  });

  describe("changeTooltips", () => {
    beforeEach(() => {
      service.settings = {
        isDarkTheme: true,
        showTooltips: false
      };
    });

    it("should update tooltip setting", () => {
      service.changeTooltips(true);

      expect(service.settings.showTooltips).toBe(true);
    });

    it("should cache settings after tooltip change", () => {
      jest.spyOn(service, "cacheSettings");
      
      service.changeTooltips(true);

      expect(service.cacheSettings).toHaveBeenCalled();
    });
  });
});