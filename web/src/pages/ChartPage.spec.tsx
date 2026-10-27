import { fireEvent, render, screen } from "@testing-library/react";
import type { Dispatch } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IndicatorListing, IndicatorSelection } from "../types/chart.types";

const mocks = vi.hoisted(() => ({
  retryLoad: vi.fn(),
  apiError: true,
  offline: false,
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
    offline: mocks.offline,
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
  mocks.offline = false;
  mocks.selections = [{ ucid: "u1", uiid: "BB", label: "BB(20,2)" }];
});

describe("ChartPage", () => {
  it("offers a retry when the chart data cannot be loaded", () => {
    render(<ChartPage />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(mocks.retryLoad).toHaveBeenCalledTimes(1);
  });

  it("flags the offline snapshot with a warning icon beside the settings button", async () => {
    mocks.apiError = false;
    mocks.offline = true;
    render(<ChartPage />);

    expect(
      screen.getByText(/Showing saved data/, { selector: "[role=status]" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("region")).toBeNull();

    // Pressing the icon shows the explanation, for visitors a hover tooltip never reaches.
    fireEvent.click(screen.getByRole("button", { name: "Live API unreachable" }));
    expect(await screen.findByText(/Showing saved data/, { selector: "p" })).toBeInTheDocument();
  });

  it("shows no warning while the live API answers", () => {
    mocks.apiError = false;
    render(<ChartPage />);

    expect(screen.queryByRole("button", { name: "Live API unreachable" })).toBeNull();
  });

  describe("after the settings dialog", () => {
    beforeEach(() => {
      mocks.apiError = false;
    });

    const openSettings = (): void => {
      render(<ChartPage />);
      fireEvent.click(screen.getByRole("button", { name: /settings/i }));
    };

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
