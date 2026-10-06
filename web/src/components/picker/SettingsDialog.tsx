import { useId, useReducer, useRef, useState, type Dispatch } from "react";
import { flushSync } from "react-dom";

import type { ChartController } from "../../charting/chartController";
import type { IndicatorListing, IndicatorSelection } from "../../types/chart.types";
import { changeTheme, changeTooltips, getSettings } from "../../services/userPrefs";

import { Modal } from "./Modal";

interface SettingsDialogProps {
  controller: ChartController;
  onClose: () => void;
  /** Open the indicator config dialog for the chosen listing. */
  onPickIndicator: (listing: IndicatorListing) => void;
  /** Open the config dialog to edit a displayed indicator in place. */
  onEditIndicator: Dispatch<IndicatorSelection>;
}

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function StandardCheckbox({
  id,
  className,
  checked,
  ariaLabel,
  onChange
}: {
  id?: string;
  className?: string;
  checked: boolean;
  ariaLabel: string;
  onChange: (value: boolean) => void;
}): React.JSX.Element {
  return (
    <input
      type="checkbox"
      id={id}
      aria-label={ariaLabel}
      checked={checked}
      onChange={event => onChange(event.target.checked)}
      className={className ? `standard-checkbox ${className}` : "standard-checkbox"}
    />
  );
}

/** A single labelled on/off switch used in the general-settings list. */
function ToggleRow({ label, checked, onChange }: ToggleRowProps): React.JSX.Element {
  return (
    <li>
      <span className="toggle-label no-wrap">{label}</span>
      <label className="switch">
        <StandardCheckbox ariaLabel={label} checked={checked} onChange={onChange} />
        <span className="slider" />
      </label>
    </li>
  );
}

type MoveButtonNode = HTMLButtonElement;
/** Records a row's move button under `ucid:offset`, so focus can follow a move. */
function makeMoveButtonRef(buttons: Map<string, MoveButtonNode>) {
  return (ucid: string, offset: -1 | 1) =>
    (node: MoveButtonNode | null): void => {
      const key = `${ucid}:${offset}`;
      if (node) buttons.set(key, node);
      else buttons.delete(key);
    };
}

type MoveButtonRef = ReturnType<typeof makeMoveButtonRef>;

interface DisplayedIndicatorsProps {
  selections: readonly IndicatorSelection[];
  checked: ReadonlySet<string>;
  onToggle: (ucid: string) => void;
  onSelectAll: (value: boolean) => void;
  onRemove: () => void;
  onEdit: Dispatch<IndicatorSelection>;
  onMove: ChartController["moveSelection"];
  /** Ref callback factory that records a row's move button so focus can follow a move. */
  moveButtonRef: MoveButtonRef;
  /** Builds a link that restores the displayed indicators. */
  shareUrl: () => string;
}

interface SelectionGroupProps extends Omit<
  DisplayedIndicatorsProps,
  "onSelectAll" | "onRemove" | "shareUrl"
> {
  title: string;
  hint: string;
}

/** One group of displayed indicators, with edit and reorder controls per row. */
function SelectionGroup({
  title,
  hint,
  selections,
  checked,
  onToggle,
  onEdit,
  onMove,
  moveButtonRef
}: SelectionGroupProps): React.JSX.Element | null {
  const headingId = useId();
  if (selections.length === 0) return null;
  return (
    <>
      <div className="selection-group-header">
        <span id={headingId} className="selection-group-title">
          {title}
        </span>
        <span className="selection-group-hint">{hint}</span>
      </div>
      <ul className="selection-list" aria-labelledby={headingId}>
        {selections.map((selection, index) => (
          <li key={selection.ucid}>
            <label htmlFor={`select-${selection.ucid}`}>{selection.label}</label>
            <button
              type="button"
              className="icon-button"
              aria-label={`move ${selection.label} up`}
              ref={moveButtonRef(selection.ucid, -1)}
              title="move up"
              disabled={index === 0}
              onClick={() => {
                onMove(selection.ucid, -1);
              }}
            >
              <span className="material-icons">arrow_upward</span>
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label={`move ${selection.label} down`}
              ref={moveButtonRef(selection.ucid, 1)}
              title="move down"
              disabled={index === selections.length - 1}
              onClick={() => {
                onMove(selection.ucid, 1);
              }}
            >
              <span className="material-icons">arrow_downward</span>
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label={`edit ${selection.label}`}
              title={`edit ${selection.label}`}
              onClick={() => {
                onEdit(selection);
              }}
            >
              <span className="material-icons">edit</span>
            </button>
            <StandardCheckbox
              id={`select-${selection.ucid}`}
              className="selection-checkbox"
              ariaLabel={`select ${selection.label}`}
              checked={checked.has(selection.ucid)}
              onChange={() => onToggle(selection.ucid)}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

/** Displayed indicators grouped by chart, with edit, reorder, and multi-select removal. */
function DisplayedIndicators({
  selections,
  checked,
  onToggle,
  onSelectAll,
  onRemove,
  onEdit,
  onMove,
  moveButtonRef,
  shareUrl
}: DisplayedIndicatorsProps): React.JSX.Element {
  const [copyStatus, setCopyStatus] = useState("");
  const copyLink = (): void => {
    navigator.clipboard.writeText(shareUrl()).then(
      () => {
        setCopyStatus("Link copied");
      },
      () => {
        setCopyStatus("Copy failed");
      }
    );
  };
  const groupProps = { checked, onToggle, onEdit, onMove, moveButtonRef };
  return (
    <section className="displayed-indicators">
      <div className="dialog-section-header">
        <span>Displayed indicators</span>
        <span className="filler" />
        <StandardCheckbox
          ariaLabel="select all displayed indicators"
          checked={checked.size > 0 && checked.size === selections.length}
          onChange={onSelectAll}
        />
      </div>
      <SelectionGroup
        {...groupProps}
        title="Price chart overlays"
        hint="earlier rows draw on top; bands stay behind lines"
        selections={selections.filter(s => s.chartType === "overlay")}
      />
      <SelectionGroup
        {...groupProps}
        title="Oscillator charts"
        hint="top to bottom, below the price chart"
        selections={selections.filter(s => s.chartType === "oscillator")}
      />
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
        <button
          type="button"
          className="btn-raised"
          title="copy a link that restores these indicators"
          onClick={copyLink}
        >
          COPY LINK
        </button>
        <span role="status" aria-live="polite" className="copy-link-status">
          {copyStatus}
        </span>
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
  moveSelection: ChartController["moveSelection"];
  moveButtonRef: MoveButtonRef;
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

  // A move re-renders the row (React moves the swapped node) or disables the
  // pressed button at the end of its group; either drops focus to <body>.
  const moveButtons = useRef(new Map<string, MoveButtonNode>());
  const moveButtonRef = makeMoveButtonRef(moveButtons.current);

  const moveSelection = (ucid: string, offset: -1 | 1): void => {
    controller.moveSelection(ucid, offset);
    flushSync(forceUpdate);
    const same = moveButtons.current.get(`${ucid}:${offset}`);
    (same && !same.disabled ? same : moveButtons.current.get(`${ucid}:${-offset}`))?.focus();
  };

  return {
    isDarkTheme,
    showTooltips,
    checked,
    onToggleTheme,
    onToggleTooltips,
    toggleChecked,
    selectAll,
    removeSelected,
    moveSelection,
    moveButtonRef
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
  onPickIndicator,
  onEditIndicator
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
            onEdit={onEditIndicator}
            onMove={controls.moveSelection}
            moveButtonRef={controls.moveButtonRef}
            shareUrl={() => controller.shareUrl()}
          />
        )}

        <AvailableIndicators listings={controller.listings} onPick={onPickIndicator} />
      </div>
    </Modal>
  );
}
