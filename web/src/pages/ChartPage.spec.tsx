import { fireEvent, render, screen } from "@testing-library/react";
import type { Dispatch } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IndicatorListing, IndicatorSelection } from "../types/chart.types";

const mocks = vi.hoisted(() => ({
  retryLoad: vi.fn(),
  apiError: true,
  selections: [] as { ucid: string; uiid: string; label: string }[]
}));
const listing = { uiid: "BB", name: "Bollinger Bands" } as unknown as IndicatorListing;

vi.mock("../charting/useChart", () => ({
  getChartController: () => ({
    loadCharts: vi.fn().mockResolvedValue(undefined),
    retryLoad: mocks.retryLoad,
    listings: [listing],
    get selections() {
      return mocks.selections;
    }
  }),
  useChartState: () => ({
    loading: false,
    apiError: mocks.apiError,
    offline: false,
    sharedView: false
  })
}));

vi.mock("../components/picker/SettingsDialog", () => ({
  SettingsDialog: (props: {
    notice?: string;
    onPickIndicator: Dispatch<IndicatorListing>;
    onEditIndicator: Dispatch<IndicatorSelection>;
  }) => (
    <div role="dialog" aria-label="settings">
      <span data-testid="notice">{props.notice}</span>
      <button
        type="button"
        onClick={() => {
          props.onPickIndicator(listing);
        }}
      >
        pick
      </button>
      <button
        type="button"
        onClick={() => {
          props.onEditIndicator({ ucid: "u1", uiid: "BB" } as IndicatorSelection);
        }}
      >
        edit indicator
      </button>
    </div>
  )
}));

vi.mock("../components/picker/PickConfigDialog", () => ({
  PickConfigDialog: (props: { onClose: () => void }) => (
    <div role="dialog" aria-label="config">
      <button
        type="button"
        onClick={() => {
          mocks.selections.push({ ucid: "u2", uiid: "BB", label: "BB(20,2)" });
          props.onClose();
        }}
      >
        add
      </button>
      <button type="button" onClick={props.onClose}>
        close
      </button>
    </div>
  )
}));

import { ChartPage } from "./ChartPage";

beforeEach(() => {
  mocks.apiError = true;
  mocks.selections = [{ ucid: "u1", uiid: "BB", label: "BB(20,2)" }];
  mocks.retryLoad.mockClear();
});

describe("ChartPage", () => {
  it("offers a retry when the chart data cannot be loaded", () => {
    render(<ChartPage />);

    fireEvent.click(screen.getByRole("button", { name: "TRY AGAIN" }));

    expect(mocks.retryLoad).toHaveBeenCalledTimes(1);
  });

  describe("after the settings dialog", () => {
    beforeEach(() => {
      mocks.apiError = false;
    });

    const openSettings = (): void => {
      render(<ChartPage />);
      fireEvent.click(screen.getByRole("button", { name: /settings/i }));
    };

    it("says which data is shown and names the settings button", () => {
      render(<ChartPage />);

      expect(screen.getByText("QQQ · daily bars")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Indicators and settings" })).toBeInTheDocument();
    });

    it("names an indicator that was added", () => {
      openSettings();
      fireEvent.click(screen.getByText("pick"));
      fireEvent.click(screen.getByText("add"));

      expect(screen.getByTestId("notice")).toHaveTextContent("BB(20,2) added");
    });

    it("reports no addition after an edit", () => {
      openSettings();
      fireEvent.click(screen.getByText("edit indicator"));
      fireEvent.click(screen.getByText("close"));

      expect(screen.getByTestId("notice")).toBeEmptyDOMElement();
    });

    it("drops an earlier add's notice when an edit follows", () => {
      openSettings();
      fireEvent.click(screen.getByText("pick"));
      fireEvent.click(screen.getByText("add"));
      fireEvent.click(screen.getByText("edit indicator"));
      fireEvent.click(screen.getByText("close"));

      expect(screen.getByTestId("notice")).toBeEmptyDOMElement();
    });
  });
});
