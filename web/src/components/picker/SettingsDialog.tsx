import { useId, useReducer, useState } from "react";

import type { ChartController } from "../../charting/chartController";
import type { IndicatorListing } from "../../types/chart.types";
import { changeTheme, changeTooltips, getSettings } from "../../services/userPrefs";

import { Modal } from "./Modal";

interface SettingsDialogProps {
  controller: ChartController;
  onClose: () => void;
  /** Open the indicator config dialog for the chosen listing. */
  onPickIndicator: (listing: IndicatorListing) => void;
}

/**
 * Port of `SettingsComponent`: the chart settings dialog. Toggles theme /
 * tooltips, lists displayed indicators (with multi-select removal), and lists
 * available indicators that open the {@link PickConfigDialog}.
 */
export function SettingsDialog({
  controller,
  onClose,
  onPickIndicator
}: SettingsDialogProps): React.JSX.Element {
  const titleId = useId();
  const initial = getSettings();
  const [isDarkTheme, setIsDarkTheme] = useState(initial.isDarkTheme);
  const [showTooltips, setShowTooltips] = useState(initial.showTooltips);
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const selections = controller.selections;
  const listings = controller.listings;

  const onToggleTheme = (value: boolean): void => {
    setIsDarkTheme(value);
    changeTheme(value);
    controller.onSettingsChange();
  };

  const onToggleTooltips = (value: boolean): void => {
    setShowTooltips(value);
    changeTooltips(value);
    controller.onSettingsChange();
  };

  const toggleChecked = (ucid: string): void => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(ucid)) next.delete(ucid);
      else next.add(ucid);
      return next;
    });
  };

  const selectAll = (value: boolean): void => {
    setChecked(value ? new Set(selections.map(s => s.ucid)) : new Set());
  };

  const removeSelected = (): void => {
    checked.forEach(ucid => controller.deleteSelection(ucid));
    setChecked(new Set());
    forceUpdate();
  };

  return (
    <Modal open onClose={onClose} labelledBy={titleId} className="settings-dialog">
      <div className="dialog-toolbar">
        <span id={titleId}>Chart settings</span>
        <span className="filler" />
        <button
          type="button"
          className="icon-button"
          aria-label="close"
          title="close"
          onClick={onClose}
        >
          <span className="material-icons">close</span>
        </button>
      </div>

      <div className="dialog-body">
        {/* GENERAL SETTINGS */}
        <ul className="general-settings">
          <li>
            <span className="toggle-label no-wrap">Dark theme</span>
            <label className="switch">
              <input
                type="checkbox"
                aria-label="Dark theme"
                checked={isDarkTheme}
                onChange={event => onToggleTheme(event.target.checked)}
              />
              <span className="slider" />
            </label>
          </li>
          <li>
            <span className="toggle-label no-wrap">Show tooltips</span>
            <label className="switch">
              <input
                type="checkbox"
                aria-label="Show tooltips"
                checked={showTooltips}
                onChange={event => onToggleTooltips(event.target.checked)}
              />
              <span className="slider" />
            </label>
          </li>
        </ul>

        {/* DISPLAYED INDICATORS */}
        {selections.length > 0 && (
          <section className="displayed-indicators">
            <div className="dialog-section-header">
              <span>Displayed indicators</span>
              <span className="filler" />
              <input
                type="checkbox"
                aria-label="select all displayed indicators"
                checked={checked.size > 0 && checked.size === selections.length}
                onChange={event => selectAll(event.target.checked)}
              />
            </div>
            <ul className="selection-list">
              {selections.map(selection => (
                <li key={selection.ucid}>
                  <label>
                    <input
                      type="checkbox"
                      checked={checked.has(selection.ucid)}
                      onChange={() => toggleChecked(selection.ucid)}
                    />
                    <span>{selection.label}</span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="action-button-container">
              <button
                type="button"
                className="btn-raised btn-primary"
                disabled={checked.size === 0}
                title="remove selected indicators"
                onClick={removeSelected}
              >
                REMOVE SELECTED
              </button>
            </div>
          </section>
        )}

        {/* AVAILABLE INDICATORS */}
        <section className="available-indicators">
          <div className="dialog-section-header column">
            <span>Available indicators</span>
            <span className="help-link">
              » more info in our{" "}
              <a
                title="indicator documentation"
                target="_blank"
                rel="noopener"
                href="https://dotnet.stockindicators.dev/indicators/"
              >
                online docs
              </a>
            </span>
          </div>
          <ul className="nav-list">
            {listings.map(listing => (
              <li key={listing.uiid}>
                <button type="button" onClick={() => onPickIndicator(listing)}>
                  <span className="nav-title">{listing.name}</span>
                  <span className="nav-subtitle">{listing.category}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Modal>
  );
}
