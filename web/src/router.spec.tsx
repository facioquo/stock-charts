import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("./pages/ChartPage", () => {
  throw new TypeError("Failed to fetch dynamically imported module: /assets/ChartPage-old.js");
});

import { routes } from "./router";

describe("router", () => {
  it("shows a reload screen inside the app shell when the chart page fails to load", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("button", { name: "Reload page" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /stock indicators/ })).toBeInTheDocument();
  });
});
