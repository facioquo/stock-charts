import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const retryLoad = vi.fn();

vi.mock("../charting/useChart", () => ({
  getChartController: () => ({
    loadCharts: vi.fn().mockResolvedValue(undefined),
    retryLoad,
    listings: [],
    selections: []
  }),
  useChartState: () => ({ loading: false, apiError: true, offline: false, sharedView: false })
}));

import { ChartPage } from "./ChartPage";

describe("ChartPage", () => {
  it("offers a retry when the chart data cannot be loaded", () => {
    render(<ChartPage />);

    fireEvent.click(screen.getByRole("button", { name: "TRY AGAIN" }));

    expect(retryLoad).toHaveBeenCalledTimes(1);
  });
});
