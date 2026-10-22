import { fireEvent, render, screen } from "@testing-library/react";
import { lazy } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { isStaleChunkError, RouteError } from "./RouteError";

function renderFailingRoute(error: Error): void {
  const Failing = lazy(() => Promise.reject(error));
  const router = createMemoryRouter(
    [{ path: "/", element: <Failing />, errorElement: <RouteError /> }],
    { initialEntries: ["/"] }
  );
  render(<RouterProvider router={router} />);
}

describe("isStaleChunkError", () => {
  it.each([
    "Failed to fetch dynamically imported module: https://example.test/assets/ChartPage-abc.js",
    "error loading dynamically imported module: https://example.test/assets/ChartPage-abc.js",
    "Importing a module script failed.",
    "'text/html' is not a valid JavaScript MIME type."
  ])("recognizes %s", message => {
    expect(isStaleChunkError(new TypeError(message))).toBe(true);
  });

  it("rejects other errors and non-errors", () => {
    expect(isStaleChunkError(new Error("boom"))).toBe(false);
    expect(isStaleChunkError("Failed to fetch dynamically imported module")).toBe(false);
    expect(isStaleChunkError(undefined)).toBe(false);
  });
});

describe("RouteError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("explains a stale chunk after a deploy and reloads on click", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });

    renderFailingRoute(new TypeError("Failed to fetch dynamically imported module: /assets/x.js"));

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "This demo was updated."
    );
    fireEvent.click(screen.getByRole("button", { name: "Reload page" }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it("offers a reload for any other route error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    renderFailingRoute(new Error("boom"));

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Something went wrong."
    );
    expect(screen.getByRole("button", { name: "Reload page" })).toBeInTheDocument();
  });
});
