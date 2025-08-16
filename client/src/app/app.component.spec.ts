import { TestBed } from "@angular/core/testing";
import { RouterOutlet } from "@angular/router";
import { AppComponent } from "./app.component";
import { UserService } from "./services/user.service";

describe("AppComponent", () => {
  it("should create and call loadSettings on init", async () => {
    const userServiceSpy = { loadSettings: jest.fn() } as { loadSettings: jest.Mock };

    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterOutlet],
      providers: [{ provide: UserService, useValue: userServiceSpy }]
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();

    component.ngOnInit();
    expect(userServiceSpy.loadSettings).toHaveBeenCalled();
  });
});
