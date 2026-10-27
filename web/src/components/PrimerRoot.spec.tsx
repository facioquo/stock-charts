import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { changeTheme } from "../services/userPrefs";

import { PrimerRoot } from "./PrimerRoot";

afterEach(() => {
  changeTheme(true);
  document.body.className = "";
});

describe("PrimerRoot", () => {
  // Structural on purpose: without BaseStyles the controls fall back to browser
  // defaults and nothing observable fails. `data-component` is Primer's own
  // handle; if a release moves it, re-key this assertion rather than delete it.
  it("mounts Primer's BaseStyles around the app", () => {
    const { container } = render(
      <PrimerRoot>
        <p>content</p>
      </PrimerRoot>
    );
    expect(container.querySelector('[data-component="BaseStyles"]')).not.toBeNull();
  });

  it("follows the site's dark theme switch", () => {
    changeTheme(true);
    const { container } = render(
      <PrimerRoot>
        <p>content</p>
      </PrimerRoot>
    );
    const themed = (): Element | null => container.querySelector("[data-color-mode]");
    expect(themed()).toHaveAttribute("data-color-mode", "dark");

    act(() => {
      changeTheme(false);
    });
    expect(themed()).toHaveAttribute("data-color-mode", "light");
  });
});
