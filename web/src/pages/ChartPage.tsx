import { useEffect, useRef, useState } from "react";

import { env } from "../config/env";
import { getChartController, useChartState } from "../charting/useChart";
import { SettingsDialog } from "../components/picker/SettingsDialog";
import { PickConfigDialog } from "../components/picker/PickConfigDialog";
import type { IndicatorListing, IndicatorSelection } from "../types/chart.types";
import "../components/picker/picker.scss";

// The quote service serves this one symbol at a daily interval; the quotes response names neither.
const DEMO_SYMBOL = "QQQ";

/**
 * Main chart page. Ports `ChartComponent`: bootstraps the overlay chart,
 * renders loading / API-error states, and hosts the settings FAB plus the
 * settings / indicator-picker dialogs.
 */
export function ChartPage(): React.JSX.Element {
  const { loading, apiError, offline, sharedView } = useChartState();
  const isProduction = env.production;
  const controller = getChartController();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pickListing, setPickListing] = useState<IndicatorListing | null>(null);
  const [editUcid, setEditUcid] = useState<string | null>(null);
  // The settings dialog remounts after each add; these carry its place and a result line across.
  const settingsScroll = useRef(0);
  const idsBeforePick = useRef<ReadonlySet<string>>(new Set());
  const [addedNotice, setAddedNotice] = useState("");

  useEffect(() => {
    void controller.loadCharts();
  }, [controller]);

  // The retry button unmounts with the error panel, so focus is handed to whatever replaces it.
  const retried = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!retried.current) return;
    if (apiError) errorRef.current?.focus();
    else if (loading) loadingRef.current?.focus();
    else {
      chartRef.current?.focus();
      retried.current = false;
    }
  }, [apiError, loading]);

  // Choosing an indicator closes settings and opens
  // the config dialog; closing the config dialog reopens settings (which then
  // reflects any newly-added indicator).
  const openIndicatorSettings = (listing: IndicatorListing): void => {
    idsBeforePick.current = new Set(controller.selections.map(s => s.ucid));
    setAddedNotice("");
    setSettingsOpen(false);
    setPickListing(listing);
  };

  // Edit reuses the config dialog, preloaded with the displayed selection.
  const openIndicatorEdit = (selection: IndicatorSelection): void => {
    const listing = controller.listings.find(x => x.uiid === selection.uiid);
    if (!listing) return;
    setSettingsOpen(false);
    setEditUcid(selection.ucid);
    idsBeforePick.current = new Set(controller.selections.map(s => s.ucid));
    setAddedNotice("");
    setPickListing(listing);
  };

  const closePickConfig = (): void => {
    const added = controller.selections.filter(s => !idsBeforePick.current.has(s.ucid));
    if (added.length > 0) setAddedNotice(`${added.map(s => s.label).join(", ")} added`);
    setPickListing(null);
    setEditUcid(null);
    setSettingsOpen(true);
  };

  return (
    <>
      {apiError && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          className="api-error-container"
        >
          <div className="api-error-content">
            <span className="material-icons api-error-icon">cloud_off</span>

            {isProduction ? (
              <>
                <h2>Charts Temporarily Unavailable</h2>
                <p>
                  We&apos;re unable to load chart data at the moment. Please try again in a few
                  moments.
                </p>
                <p className="api-error-docs">
                  If the issue persists, please{" "}
                  <a
                    href="https://github.com/facioquo/stock-charts/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    report an issue
                  </a>
                  .
                </p>
              </>
            ) : (
              <>
                <h2>Backend API Unavailable</h2>
                <p>
                  The Stock Indicators API is not currently accessible. Please ensure the backend
                  services are running:
                </p>
                <ul className="api-error-list">
                  <li>Web API (port 5001)</li>
                </ul>
                <p className="api-error-help">
                  Run <code>pnpm start</code> for the frontend, and{" "}
                  <code>cd server/WebApi &amp;&amp; dotnet run</code> for the backend.
                </p>
              </>
            )}

            <button
              type="button"
              className="btn-raised btn-primary"
              onClick={() => {
                retried.current = true;
                void controller.retryLoad();
              }}
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* Mounted before it has text, so a screen reader announces the notice when it fills. */}
      <div className={offline && !apiError ? "shared-view-banner" : undefined}>
        <span role="status" className={offline && !apiError ? "banner-text" : undefined}>
          {offline && !apiError
            ? "The live API is unreachable. Showing saved data; indicators with custom settings may be blank."
            : ""}
        </span>
      </div>

      {/* The status region stays mounted so a screen reader announces its text when it fills. */}
      <div className={sharedView ? "shared-view-banner" : undefined}>
        {sharedView && (
          <span className="material-icons" aria-hidden="true">
            link
          </span>
        )}
        <span role="status" className={sharedView ? "banner-text" : undefined}>
          {sharedView ? "Showing a shared chart." : ""}
        </span>
        {sharedView && (
          <button
            type="button"
            className="btn-raised btn-primary"
            onClick={() => {
              controller.returnToSavedSetup();
            }}
          >
            BACK TO MY INDICATORS
          </button>
        )}
      </div>

      {/* SETTINGS FAB */}
      {!loading && !apiError && (
        <div className="fab-container">
          <button
            type="button"
            className="fab"
            aria-label="Indicators and settings"
            title="change indicators and settings"
            onClick={() => setSettingsOpen(true)}
          >
            <span className="material-icons" aria-hidden="true">
              edit
            </span>
            <span className="fab-label">Indicators and settings</span>
          </button>
        </div>
      )}

      {!apiError && <p className="chart-caption">{DEMO_SYMBOL} · daily bars</p>}

      {/* CHART (MAIN OVERLAY) — kept mounted while loading so its aspect-ratio
          reserves the chart's space and the spinner overlays it in place,
          avoiding the empty → spinner → chart layout shift on load. */}
      <div
        ref={chartRef}
        tabIndex={-1}
        role="group"
        aria-label="Price chart"
        id="chart-overlay"
        className="chart-overlay-container"
        hidden={apiError}
      >
        <canvas id="chartOverlay" />
        {loading && (
          <div
            ref={loadingRef}
            tabIndex={-1}
            className="chart-loading"
            role="status"
            aria-live="polite"
          >
            <p className="chart-loading-spinner">
              <img src="/assets/candle-spinner.svg" alt="Loading data" height={30} />
            </p>
            <p className="chart-loading-label">Loading</p>
          </div>
        )}
      </div>

      {/* CHART (OSCILLATORS) */}
      <div id="oscillators-zone" hidden={loading} />

      {/* DIALOGS */}
      {settingsOpen && (
        <SettingsDialog
          controller={controller}
          onClose={() => {
            settingsScroll.current = 0;
            setAddedNotice("");
            setSettingsOpen(false);
          }}
          notice={addedNotice}
          initialScrollTop={settingsScroll.current}
          onScrollChange={top => {
            settingsScroll.current = top;
          }}
          onPickIndicator={openIndicatorSettings}
          onEditIndicator={openIndicatorEdit}
        />
      )}
      {pickListing && (
        <PickConfigDialog
          listing={pickListing}
          controller={controller}
          selection={controller.selections.find(s => s.ucid === editUcid)}
          onClose={closePickConfig}
        />
      )}
    </>
  );
}
