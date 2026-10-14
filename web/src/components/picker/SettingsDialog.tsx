import {
  useEffect,
  useId,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type Dispatch
} from "react";
import { flushSync } from "react-dom";

import type { ChartController } from "../../charting/chartController";
import type { IndicatorListing, IndicatorSelection } from "../../types/chart.types";
import { changeTheme, changeTooltips, getSettings } from "../../services/userPrefs";
import { categoryLabel } from "./categoryLabel";

import { Modal } from "./Modal";

interface SettingsDialogProps {
  controller: ChartController;
  onClose: () => void;
  /** Open the indicator config dialog for the chosen listing. */
  onPickIndicator: (listing: IndicatorListing) => void;
  /** Open the config dialog to edit a displayed indicator in place. */
  onEditIndicator: Dispatch<IndicatorSelection>;
  /** Result line of the last add, shown while the dialog is open. */
  notice?: string;
  /** Scroll position to restore when the dialog reopens after adding an indicator. */
  initialScrollTop?: number;
  onScrollChange?: Dispatch<number>;
}

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

/**
 * Splices each restored ucid back into the current order before the nearest ucid that
 * followed it in `before` and is still listed, or at the end when none remains. The
 * order of every other indicator is left as it is now.
 */
function orderWithRestored(current: string[], before: string[], restored: string[]): string[] {
  const restoredSet = new Set(restored);
  const order = current.filter(ucid => !restoredSet.has(ucid));
  for (const ucid of before.filter(u => restoredSet.has(u))) {
    const following = before.slice(before.indexOf(ucid) + 1).find(u => order.includes(u));
    const at = following === undefined ? order.length : order.indexOf(following);
    order.splice(at, 0, ucid);
  }
  return order;
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
          <li key={selection.ucid} className={checked.has(selection.ucid) ? "selected" : undefined}>
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
    setCopyStatus("");
    const failed = (): void => {
      setCopyStatus("Copy failed");
    };
    try {
      // The clipboard is undefined outside a secure context, so this can throw synchronously.
      navigator.clipboard.writeText(shareUrl()).then(() => {
        setCopyStatus("Link copied");
      }, failed);
    } catch {
      failed();
    }
  };
  const groupProps = { checked, onToggle, onEdit, onMove, moveButtonRef };
  return (
    <section className="displayed-indicators">
      <div className="dialog-section-header">
        <span>Displayed indicators</span>
        <span className="filler" />
        <button
          type="button"
          className="icon-button"
          aria-label="copy share link"
          title="copy a link that restores these indicators"
          onClick={copyLink}
        >
          <span className="material-icons">share</span>
        </button>
        <StandardCheckbox
          className="selection-checkbox"
          ariaLabel="select all displayed indicators"
          checked={checked.size > 0 && checked.size === selections.length}
          onChange={onSelectAll}
        />
      </div>
      <span role="status" className="copy-link-status">
        {copyStatus}
      </span>
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
          {checked.size > 0 ? `REMOVE SELECTED (${checked.size})` : "REMOVE SELECTED"}
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
              <span className="nav-subtitle">{categoryLabel(listing.category)}</span>
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
  /** Result line after a removal, with what undo needs; null when nothing was removed. */
  removal: { text: string; undo?: () => void } | null;
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

  const [removal, setRemoval] = useState<SettingsControls["removal"]>(null);

  const removeSelected = (): void => {
    const orderBefore = controller.selections.map(s => s.ucid);
    const removed = controller.selections.filter(s => checked.has(s.ucid));
    for (const selection of removed) controller.deleteSelection(selection.ucid);
    setChecked(new Set());
    if (removed.length > 0) {
      setRemoval({
        text:
          removed.length === 1
            ? `Removed ${removed[0]?.label}`
            : `Removed ${removed.length} indicators`,
        undo: () => {
          // One restore per removal: a second click would draw the same indicators twice.
          setRemoval({ text: "Restoring…" });
          const restores = removed.flatMap(selection => {
            const listing = controller.listings.find(x => x.uiid === selection.uiid);
            return listing ? [controller.addSelection(selection, listing)] : [];
          });
          void Promise.allSettled(restores).then(results => {
            // Adding appends; put each restored indicator back beside its old neighbour and
            // leave every reorder made since the removal alone.
            controller.applyOrder(
              orderWithRestored(
                controller.selections.map(s => s.ucid),
                orderBefore,
                removed.map(s => s.ucid)
              )
            );
            const skipped = removed.length - restores.length;
            const failed = skipped + results.filter(r => r.status === "rejected").length;
            setRemoval({
              text:
                failed === 0
                  ? removed.length === 1
                    ? `Restored ${removed[0]?.label}`
                    : `Restored ${removed.length} indicators`
                  : failed === removed.length
                    ? "Could not restore the removed indicators"
                    : `Restored ${removed.length - failed} of ${removed.length} indicators`
            });
            forceUpdate();
          });
        }
      });
    }
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
    removal,
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
  onEditIndicator,
  notice = "",
  initialScrollTop = 0,
  onScrollChange
}: SettingsDialogProps): React.JSX.Element {
  const titleId = useId();
  const controls = useSettingsControls(controller);
  const selections = controller.selections;
  const bodyRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = initialScrollTop;
  }, [initialScrollTop]);

  // Filled after mount, so a screen reader announces it as an update to a live region.
  const [announced, setAnnounced] = useState("");
  useEffect(() => {
    setAnnounced(notice);
  }, [notice]);
  const status = controls.removal?.text ?? announced;

  return (
    <Modal open onClose={onClose} labelledBy={titleId} className="settings-dialog">
      <DialogToolbar titleId={titleId} onClose={onClose} />

      <div
        ref={bodyRef}
        className="dialog-body"
        onScroll={event => {
          onScrollChange?.(event.currentTarget.scrollTop);
        }}
      >
        {/* Mounted before it has text, so a screen reader announces the result when it fills. */}
        <div className={status || notice ? "settings-status" : undefined}>
          <span aria-live="polite">{status}</span>
          {controls.removal?.undo && (
            <button
              type="button"
              className="btn-text"
              title="add back where it was"
              onClick={controls.removal.undo}
            >
              UNDO
            </button>
          )}
        </div>
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
