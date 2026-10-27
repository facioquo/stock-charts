import { useEffect, useRef, useState } from "react";
import { AnchoredOverlay, Banner, Button, IconButton, Text, VisuallyHidden } from "@primer/react";
import { AlertIcon, CloudOfflineIcon, LinkIcon, PencilIcon } from "@primer/octicons-react";

import { env } from "../config/env";
import { getChartController, useChartState } from "../charting/useChart";
import { SettingsDialog } from "../components/picker/SettingsDialog";
import { PickConfigDialog } from "../components/picker/PickConfigDialog";
import type { IndicatorListing, IndicatorSelection } from "../types/chart.types";
import "../components/picker/picker.scss";

const OFFLINE_NOTICE =
  "The live API is unreachable. Showing saved data; indicators with custom settings may be blank.";

/**
 * A warning icon that opens the offline explanation when pressed, so a touch or
 * keyboard visitor can read it; a tooltip alone shows only on hover.
 */
function OfflineNotice(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <AnchoredOverlay
      open={open}
      onOpen={() => {
        setOpen(true);
      }}
      onClose={() => {
        setOpen(false);
      }}
      side="outside-bottom"
      align="end"
      width="medium"
      renderAnchor={anchorProps => (
        <IconButton
          {...anchorProps}
          icon={AlertIcon}
          variant="invisible"
          size="large"
          className="offline-icon"
          aria-label="Live API unreachable"
          // The open notice says more than the name; its tooltip would cover it.
          unsafeDisableTooltip={open}
        />
      )}
    >
      <Text as="p" size="small" className="offline-notice">
        {OFFLINE_NOTICE}
      </Text>
    </AnchoredOverlay>
  );
}

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
  const settingsFilter = useRef("");
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
            <CloudOfflineIcon size={48} className="api-error-icon" />

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

            <Button
              variant="primary"
              onClick={() => {
                retried.current = true;
                void controller.retryLoad();
              }}
            >
              Try again
            </Button>
          </div>
        </div>
      )}

      {/* Mounted before it has text, so a screen reader announces the notice when it fills. */}
      <VisuallyHidden role="status">{offline && !apiError ? OFFLINE_NOTICE : ""}</VisuallyHidden>
      {/* In the header beside the settings button, but scrolls away with the page. */}
      {offline && !apiError && !loading && (
        <div className="offline-indicator">
          <OfflineNotice />
        </div>
      )}

      {/* The status region stays mounted so a screen reader announces its text when it fills. */}
      <div role="status" className="page-banner">
        {sharedView && (
          <Banner
            title="Shared chart"
            hideTitle
            variant="info"
            leadingVisual={<LinkIcon />}
            description="Showing a shared chart."
            primaryAction={
              <Banner.PrimaryAction
                onClick={() => {
                  controller.returnToSavedSetup();
                }}
              >
                Back to my indicators
              </Banner.PrimaryAction>
            }
          />
        )}
      </div>

      {/* SETTINGS BUTTON */}
      {!loading && !apiError && (
        <div className="fab-container">
          <IconButton
            icon={PencilIcon}
            size="large"
            className="fab"
            aria-label="edit settings"
            description="Change indicators and settings"
            onClick={() => setSettingsOpen(true)}
          />
        </div>
      )}

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
            settingsFilter.current = "";
            setAddedNotice("");
            setSettingsOpen(false);
          }}
          notice={addedNotice}
          initialScrollTop={settingsScroll.current}
          onScrollChange={top => {
            settingsScroll.current = top;
          }}
          initialFilter={settingsFilter.current}
          onFilterChange={text => {
            settingsFilter.current = text;
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
