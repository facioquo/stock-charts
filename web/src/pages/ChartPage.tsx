import { useEffect, useState } from "react";

import { env } from "../config/env";
import { getChartController, useChartState } from "../charting/useChart";
import { SettingsDialog } from "../components/picker/SettingsDialog";
import { PickConfigDialog } from "../components/picker/PickConfigDialog";
import type { IndicatorListing } from "../types/chart.types";
import "../components/picker/picker.css";

/**
 * Main chart page. Ports `ChartComponent`: bootstraps the overlay chart,
 * renders loading / API-error states, and hosts the settings FAB plus the
 * settings / indicator-picker dialogs.
 */
export function ChartPage(): React.JSX.Element {
  const { loading, apiError } = useChartState();
  const isProduction = env.production;
  const controller = getChartController();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pickListing, setPickListing] = useState<IndicatorListing | null>(null);

  useEffect(() => {
    void controller.loadCharts();
  }, [controller]);

  // Mirror the Angular flow: choosing an indicator closes settings and opens
  // the config dialog; closing the config dialog reopens settings (which then
  // reflects any newly-added indicator).
  const openIndicatorSettings = (listing: IndicatorListing): void => {
    setSettingsOpen(false);
    setPickListing(listing);
  };

  const closePickConfig = (): void => {
    setPickListing(null);
    setSettingsOpen(true);
  };

  return (
    <>
      {loading && (
        <div role="status" aria-live="polite">
          <div className="chart-loading">
            <p className="chart-loading-spinner">
              <img src="/assets/candle-spinner.svg" alt="Loading data" height={30} />
            </p>
            <p className="chart-loading-label">Loading</p>
          </div>
        </div>
      )}

      {apiError && (
        <div role="alert" aria-live="assertive" className="api-error-container">
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
                  <li>Azure Functions (port 7071)</li>
                  <li>Web API (port 5001)</li>
                  <li>Azurite Storage Emulator</li>
                </ul>
                <p className="api-error-help">
                  Run <code>pnpm dev</code> for the frontend and start the backend services.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* SETTINGS FAB */}
      {!loading && !apiError && (
        <div className="fab-container">
          <button
            type="button"
            className="fab"
            aria-label="edit settings"
            title="change indicators and settings"
            onClick={() => setSettingsOpen(true)}
          >
            <span className="material-icons">edit</span>
          </button>
        </div>
      )}

      {/* CHART (MAIN OVERLAY) */}
      <div id="chart-overlay" className="chart-overlay-container" hidden={loading}>
        <canvas id="chartOverlay" />
      </div>

      {/* CHART (OSCILLATORS) */}
      <div id="oscillators-zone" hidden={loading} />

      {/* DIALOGS */}
      {settingsOpen && (
        <SettingsDialog
          controller={controller}
          onClose={() => setSettingsOpen(false)}
          onPickIndicator={openIndicatorSettings}
        />
      )}
      {pickListing && (
        <PickConfigDialog listing={pickListing} controller={controller} onClose={closePickConfig} />
      )}
    </>
  );
}
