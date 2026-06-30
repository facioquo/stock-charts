import { useId, useReducer, useState } from "react";

import type { ChartController } from "../../charting/chartController";
import type { IndicatorListing, IndicatorSelection } from "../../types/chart.types";
import { changeTheme, changeTooltips, getSettings } from "../../services/userPrefs";

import { Modal } from "./Modal";

interface SettingsDialogProps {
  controller: ChartController;
  onClose: () => void;
  /** Open the indicator config dialog for the chosen listing. */
  onPickIndicator: (listing: IndicatorListing) => void;
}

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

/** A single labelled on/off switch used in the general-settings list. */
function ToggleRow({ label, checked, onChange }: ToggleRowProps): React.JSX.Element {
  return (
    <li>
      <span className="toggle-label no-wrap">{label}</span>
      <label className="switch">
        <input
          type="checkbox"
          aria-label={label}
          checked={checked}
          onChange={event => onChange(event.target.checked)}
        />
        <span className="slider" />
      </label>
    </li>
  );
}

interface DisplayedIndicatorsProps {
  selections: readonly IndicatorSelection[];
  checked: ReadonlySet<string>;
  onToggle: (ucid: string) => void;
  onSelectAll: (value: boolean) => void;
  onRemove: () => void;
}

/** List of currently-displayed indicators with multi-select removal. */
function DisplayedIndicators({
  selections,
  checked,
  onToggle,
  onSelectAll,
  onRemove
}: DisplayedIndicatorsProps): React.JSX.Element {
  return (
    <section className="displayed-indicators">
      <div className="dialog-section-header">
        <span>Displayed indicators</span>
        <span className="filler" />
        <input
          type="checkbox"
          aria-label="select all displayed indicators"
          checked={checked.size > 0 && checked.size === selections.length}
          onChange={event => onSelectAll(event.target.checked)}
        />
      </div>
      <ul className="selection-list">
        {selections.map(selection => (
          <li key={selection.ucid}>
            <label>
              <span>{selection.label}</span>
              <input
                type="checkbox"
                checked={checked.has(selection.ucid)}
                onChange={() => onToggle(selection.ucid)}
              />
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
          onClick={onRemove}
        >
          REMOVE SELECTED
        </button>
      </div>
    </section>
  );
}

interface AvailableIndicatorsProps {
  listings: readonly IndicatorListing[];
  onPick: (listing: IndicatorListing) => void;
}

/** List of available indicators that open the {@link PickConfigDialog}. */
function AvailableIndicators({ listings, onPick }: AvailableIndicatorsProps): React.JSX.Element {
  return (
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
            <button type="button" onClick={() => onPick(listing)}>
              <span className="nav-title">{listing.name}</span>
              <span className="nav-subtitle">{listing.category}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Toolbar with the dialog title and a close button. */
function DialogToolbar({
  titleId,
  onClose
}: {
  titleId: string;
  onClose: () => void;
}): React.JSX.Element {
  return (
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
  );
}

interface SettingsControls {
  isDarkTheme: boolean;
  showTooltips: boolean;
  checked: ReadonlySet<string>;
  onToggleTheme: (value: boolean) => void;
  onToggleTooltips: (value: boolean) => void;
  toggleChecked: (ucid: string) => void;
  selectAll: (value: boolean) => void;
  removeSelected: () => void;
}

/** State + handlers backing the settings dialog (theme, tooltips, selection). */
function useSettingsControls(controller: ChartController): SettingsControls {
  const initial = getSettings();
  const [isDarkTheme, setIsDarkTheme] = useState(initial.isDarkTheme);
  const [showTooltips, setShowTooltips] = useState(initial.showTooltips);
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

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
    setChecked(value ? new Set(controller.selections.map(s => s.ucid)) : new Set());
  };

  const removeSelected = (): void => {
    checked.forEach(ucid => controller.deleteSelection(ucid));
    setChecked(new Set());
    forceUpdate();
  };

  return {
    isDarkTheme,
    showTooltips,
    checked,
    onToggleTheme,
    onToggleTooltips,
    toggleChecked,
    selectAll,
    removeSelected
  };
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
  const controls = useSettingsControls(controller);
  const selections = controller.selections;

  return (
    <Modal open onClose={onClose} labelledBy={titleId} className="settings-dialog">
      <DialogToolbar titleId={titleId} onClose={onClose} />

      <div className="dialog-body">
        <ul className="general-settings">
          <ToggleRow
            label="Dark theme"
            checked={controls.isDarkTheme}
            onChange={controls.onToggleTheme}
          />
          <ToggleRow
            label="Show tooltips"
            checked={controls.showTooltips}
            onChange={controls.onToggleTooltips}
          />
        </ul>

        {selections.length > 0 && (
          <DisplayedIndicators
            selections={selections}
            checked={controls.checked}
            onToggle={controls.toggleChecked}
            onSelectAll={controls.selectAll}
            onRemove={controls.removeSelected}
          />
        )}

        <AvailableIndicators listings={controller.listings} onPick={onPickIndicator} />
      </div>
    </Modal>
  );
}
