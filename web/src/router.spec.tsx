import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

// A throwing factory is rewrapped by Vitest, so throw from the export the lazy loader reads.
vi.mock("./pages/ChartPage", () => ({
  get ChartPage(): never {
    throw new TypeError("Failed to fetch dynamically imported module: /assets/ChartPage-old.js");
  }
}));

import { routes } from "./router";

describe("router", () => {
  it("shows a reload screen inside the app shell when the chart page fails to load", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("button", { name: "Reload page" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /stock indicators/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "This demo was updated." })).toBeInTheDocument();
  });
});
