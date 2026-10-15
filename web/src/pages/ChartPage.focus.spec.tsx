import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  state: { loading: false, apiError: true, offline: false, staleSince: null, sharedView: false }
}));

vi.mock("../charting/useChart", () => ({
  getChartController: () => ({
    loadCharts: vi.fn().mockResolvedValue(undefined),
    retryLoad: vi.fn(),
    listings: [],
    selections: []
  }),
  useChartState: () => mocks.state
}));

import { ChartPage } from "./ChartPage";

describe("ChartPage focus after a retry", () => {
  it("follows the page from loading to the chart on success", () => {
    mocks.state = {
      loading: false,
      apiError: true,
      offline: false,
      staleSince: null,
      sharedView: false
    };
    const { rerender } = render(<ChartPage />);
    fireEvent.click(screen.getByRole("button", { name: "TRY AGAIN" }));

    mocks.state = { ...mocks.state, apiError: false, loading: true };
    rerender(<ChartPage />);
    expect(document.activeElement).toBe(document.querySelector(".chart-loading"));

    mocks.state = { ...mocks.state, loading: false };
    rerender(<ChartPage />);
    expect(document.activeElement).toBe(screen.getByRole("group", { name: "Price chart" }));
    expect(document.activeElement?.id).toBe("chart-overlay");
  });

  it("returns to the error panel when the retry fails", () => {
    mocks.state = {
      loading: false,
      apiError: true,
      offline: false,
      staleSince: null,
      sharedView: false
    };
    const { rerender } = render(<ChartPage />);
    fireEvent.click(screen.getByRole("button", { name: "TRY AGAIN" }));

    mocks.state = { ...mocks.state, apiError: false, loading: true };
    rerender(<ChartPage />);
    mocks.state = { ...mocks.state, apiError: true, loading: false };
    rerender(<ChartPage />);

    expect(document.activeElement).toBe(screen.getByRole("alert"));
  });
});
