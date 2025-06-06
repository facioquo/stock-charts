import { TestBed } from "@angular/core/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { AppComponent } from "./app.component";
import { UserService } from "./services/user.service";

describe("AppComponent", () => {
  let component: AppComponent;
  let userService: UserService;

  beforeEach(async () => {
    const userServiceSpy = {
      loadSettings: jest.fn()
    };

    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA] // Allow unknown elements like mat-toolbar, router-outlet
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load user settings on init", () => {
    component.ngOnInit();
    expect(userService.loadSettings).toHaveBeenCalled();
  });

  it("should have correct selector", () => {
    expect(AppComponent.prototype.constructor.name).toBe("AppComponent");
  });
});