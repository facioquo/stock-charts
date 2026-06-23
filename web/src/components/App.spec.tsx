import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App shell", () => {
  it("renders the demo header toolbar", () => {
    const router = createMemoryRouter(
      [{ path: "/", element: <App />, children: [{ index: true, element: <div>home</div> }] }],
      { initialEntries: ["/"] }
    );
    render(<RouterProvider router={router} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("stock indicators");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("demo site");
    // routed outlet content renders
    expect(screen.getByText("home")).toBeInTheDocument();
  });
});
