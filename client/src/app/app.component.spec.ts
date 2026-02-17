import { TestBed } from "@angular/core/testing";
import { RouterOutlet } from "@angular/router";
import { Mock, describe, expect, it, vi } from "vitest";
import { AppComponent } from "./app.component";
import { UserService } from "./services/user.service";

describe("AppComponent", () => {
  /**
   * TODO: Angular 21 + Vitest cannot resolve external templates/styles.
   * Known issue: https://github.com/angular/angular-cli/issues/32055
   *
   * To fix, one of:
   * 1. Install @analogjs/vite-plugin-angular and configure vitest.config.ts
   * 2. Wait for official Angular CLI fix
   * 3. Convert to inline template (violates project guidelines)
   *
   * This component has external templateUrl/styleUrls which Vitest
   * cannot load without additional Vite plugin support.
   */
  it.todo("should create and call loadSettings on init", async () => {
    const userServiceSpy = { loadSettings: vi.fn() } as { loadSettings: Mock };

    await TestBed.configureTestingModule({
      imports: [RouterOutlet],
      providers: [{ provide: UserService, useValue: userServiceSpy }]
    }).compileComponents();

    const fixture = TestBed.overrideComponent(AppComponent, {
      set: {
        template: "<router-outlet></router-outlet>",
        styles: []
      }
    }).createComponent(AppComponent);

    const component = fixture.componentInstance;
    expect(component).toBeTruthy();

    component.ngOnInit();
    expect(userServiceSpy.loadSettings).toHaveBeenCalled();
  });
});
