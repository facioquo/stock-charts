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
   * The component has external templateUrl/styleUrls which Vitest cannot load.
   * TestBed.overrideComponent() doesn't work because the component metadata
   * is locked before the override can apply. Workarounds:
   * 1. Inject resolveComponentResources() manually (complex)
   * 2. Install @analogjs/vite-plugin-angular (adds dependency)
   * 3. Convert app.component to inline template (violates guidelines)
   * 4. Skip component-level tests and rely on E2E tests
   */
  it.todo("should create and call loadSettings on init", async () => {
    const userServiceSpy = { loadSettings: vi.fn() } as { loadSettings: Mock };

    await TestBed.configureTestingModule({
      imports: [RouterOutlet],
      providers: [{ provide: UserService, useValue: userServiceSpy }]
    });

    await TestBed.compileComponents();

    const fixture = TestBed.createComponent(AppComponent);

    const component = fixture.componentInstance;
    expect(component).toBeTruthy();

    component.ngOnInit();
    expect(userServiceSpy.loadSettings).toHaveBeenCalled();
  });
});
