import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type RefObject,
  type UIEventHandler
} from "react";
import { flushSync } from "react-dom";
import {
  ActionList,
  Banner,
  Button,
  Checkbox,
  Dialog,
  Heading,
  IconButton,
  Link,
  Stack,
  Text,
  TextInput,
  ToggleSwitch
} from "@primer/react";
import { GrabberIcon, LinkIcon, PencilIcon, SearchIcon } from "@primer/octicons-react";

import type { ChartController } from "../../charting/chartController";
import type { IndicatorListing, IndicatorSelection } from "../../types/chart.types";
import {
  changeSeriesLegend,
  changeTheme,
  changeTooltips,
  getSettings
} from "../../services/userPrefs";
import { filterListings, groupByCategory, type ListingGroup } from "./listingFilter";

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
  /** Filter text to restore when the dialog reopens after adding an indicator. */
  initialFilter?: string;
  onFilterChange?: Dispatch<string>;
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

/** A labelled on/off switch in the general-settings list, laid out as Primer documents it. */
function ToggleRow({ label, checked, onChange }: ToggleRowProps): React.JSX.Element {
  const labelId = useId();
  return (
    <Stack
      as="li"
      direction="horizontal"
      align="center"
      justify="space-between"
      wrap="wrap"
      gap="condensed"
    >
      <Text id={labelId} weight="semibold">
        {label}
      </Text>
      <ToggleSwitch aria-labelledby={labelId} checked={checked} onChange={onChange} />
    </Stack>
  );
}

interface DisplayedIndicatorsProps {
  selections: readonly IndicatorSelection[];
  checked: ReadonlySet<string>;
  onToggle: (ucid: string) => void;
  onSelectAll: (value: boolean) => void;
  onRemove: () => void;
  onEdit: Dispatch<IndicatorSelection>;
  onMove: ChartController["moveSelection"];
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
  onMove
}: SelectionGroupProps): React.JSX.Element | null {
  const headingId = useId();
  const [draggedUcid, setDraggedUcid] = useState<string | null>(null);
  /** Gap the dragged row would land in: 0 is above the first row, `length` below the last. */
  const [dropGap, setDropGap] = useState<number | null>(null);
  if (selections.length === 0) return null;

  const draggedIndex = selections.findIndex(selection => selection.ucid === draggedUcid);
  // The gaps on either side of the dragged row leave it where it is.
  const isMovingGap = (gap: number): boolean =>
    draggedIndex >= 0 && gap !== draggedIndex && gap !== draggedIndex + 1;

  const endDrag = (): void => {
    setDraggedUcid(null);
    setDropGap(null);
  };

  const moveToGap = (gap: number): void => {
    if (!draggedUcid || !isMovingGap(gap)) return;
    const targetIndex = gap > draggedIndex ? gap - 1 : gap;
    const offset = draggedIndex < targetIndex ? 1 : -1;
    for (let step = draggedIndex; step !== targetIndex; step += offset) {
      onMove(draggedUcid, offset);
    }
  };

  return (
    <>
      <div className="selection-group-header">
        <Heading as="h3" variant="small" id={headingId}>
          {title}
        </Heading>
        <Text size="small" className="muted-text">
          {hint}
        </Text>
      </div>
      <ul className="selection-list" aria-labelledby={headingId}>
        {selections.map((selection, index) => (
          <li
            key={selection.ucid}
            className={
              [
                checked.has(selection.ucid) && "selected",
                draggedUcid === selection.ucid && "dragging",
                dropGap === index && "drop-before",
                dropGap === selections.length && index === selections.length - 1 && "drop-after"
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
            onDragOver={event => {
              // Drag state is per group, so a row from the other group is never a target.
              if (!draggedUcid) return;
              const { top, height } = event.currentTarget.getBoundingClientRect();
              const gap = event.clientY < top + height / 2 ? index : index + 1;
              if (!isMovingGap(gap)) {
                setDropGap(null);
                return;
              }
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDropGap(gap);
            }}
            onDragLeave={event => {
              if (event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null))
                return;
              setDropGap(null);
            }}
            onDrop={event => {
              if (dropGap === null) return;
              event.preventDefault();
              moveToGap(dropGap);
              endDrag();
            }}
          >
            <IconButton
              icon={GrabberIcon}
              variant="invisible"
              className="drag-handle"
              aria-label={`reorder ${selection.label}`}
              aria-keyshortcuts="ArrowUp ArrowDown"
              description="Drag to reorder, or use the arrow keys"
              draggable
              onDragStart={event => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", selection.ucid);
                setDraggedUcid(selection.ucid);
              }}
              onDragEnd={endDrag}
              onKeyDown={event => {
                if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
                event.preventDefault();
                const handle = event.currentTarget;
                onMove(selection.ucid, event.key === "ArrowUp" ? -1 : 1);
                // React may move this row's node, which drops focus to <body>.
                handle.focus();
              }}
            />
            <label htmlFor={`select-${selection.ucid}`}>{selection.label}</label>
            <IconButton
              icon={PencilIcon}
              variant="invisible"
              aria-label={`edit ${selection.label}`}
              onClick={() => {
                onEdit(selection);
              }}
            />
            <Checkbox
              id={`select-${selection.ucid}`}
              aria-label={`select ${selection.label}`}
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
  const groupProps = { checked, onToggle, onEdit, onMove };
  return (
    <section className="displayed-indicators">
      <div className="dialog-section-header">
        <Heading as="h2" variant="medium">
          Displayed indicators
        </Heading>
        <IconButton
          icon={LinkIcon}
          variant="invisible"
          aria-label="copy share link"
          description="Copy a link that restores these indicators"
          onClick={copyLink}
        />
        <Checkbox
          aria-label="select all displayed indicators"
          checked={checked.size > 0 && checked.size === selections.length}
          onChange={event => onSelectAll(event.target.checked)}
        />
      </div>
      <Text as="p" size="small" role="status" className="copy-link-status">
        {copyStatus}
      </Text>
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
        <Button
          variant="danger"
          disabled={checked.size === 0}
          count={checked.size > 0 ? checked.size : undefined}
          onClick={onRemove}
        >
          Remove selected
        </Button>
      </div>
    </section>
  );
}

interface AvailableIndicatorsProps {
  listings: readonly IndicatorListing[];
  onPick: (listing: IndicatorListing) => void;
  initialFilter: string;
  onFilterChange?: Dispatch<string>;
}

/**
 * List of available indicators that open the {@link PickConfigDialog}, narrowed by a
 * filter box that matches name, id, and category, and grouped under category headings.
 * Enter picks the first match shown.
 */
function AvailableIndicators({
  listings,
  onPick,
  initialFilter,
  onFilterChange
}: AvailableIndicatorsProps): React.JSX.Element {
  const [filter, setFilter] = useState(initialFilter);
  const matches = filterListings(listings, filter);
  const groups = groupByCategory(matches);
  const filtering = filter.trim() !== "";
  const changeFilter = (value: string): void => {
    setFilter(value);
    onFilterChange?.(value);
  };
  return (
    <section className="available-indicators">
      <div className="dialog-section-header column">
        <Heading as="h2" variant="medium">
          Available indicators
        </Heading>
        <Text size="small" className="muted-text">
          More info in our{" "}
          <Link
            inline
            target="_blank"
            rel="noopener"
            href="https://dotnet.stockindicators.dev/indicators/"
          >
            online docs
          </Link>
        </Text>
      </div>
      <div className="listing-filter">
        <TextInput
          type="search"
          block
          leadingVisual={SearchIcon}
          aria-label="filter available indicators"
          placeholder="Filter by name or category"
          autoComplete="off"
          spellCheck={false}
          value={filter}
          onChange={event => {
            changeFilter(event.target.value);
          }}
          onKeyDown={event => {
            if (event.key !== "Enter") return;
            const first = groups[0]?.listings[0];
            if (filtering && first) {
              event.preventDefault();
              onPick(first);
            }
          }}
        />
        <Text size="small" aria-live="polite" className="listing-filter-status muted-text">
          {filtering
            ? matches.length === 0
              ? "No indicators match"
              : `${matches.length} of ${listings.length} indicators`
            : ""}
        </Text>
      </div>
      {groups.map(group => (
        <ListingCategory key={group.category} group={group} onPick={onPick} />
      ))}
    </section>
  );
}

/** One category heading and the available indicators under it. */
function ListingCategory({
  group,
  onPick
}: {
  group: ListingGroup;
  onPick: (listing: IndicatorListing) => void;
}): React.JSX.Element {
  const headingId = useId();
  return (
    <>
      <div className="selection-group-header">
        <Heading as="h3" variant="small" id={headingId}>
          {group.label}
        </Heading>
      </div>
      <ActionList aria-labelledby={headingId}>
        {group.listings.map(listing => (
          <ActionList.Item key={listing.uiid} onSelect={() => onPick(listing)}>
            {listing.name}
          </ActionList.Item>
        ))}
      </ActionList>
    </>
  );
}

interface ScrollBody {
  ref: RefObject<HTMLDivElement | null>;
  onScroll: UIEventHandler<HTMLDivElement>;
}

const ScrollBodyContext = createContext<ScrollBody | null>(null);

/**
 * The dialog's scrolling body, with its ref and scroll handler from context so the
 * position survives a reopen. Module-level, so `renderBody` keeps one identity and
 * the content below it is not remounted on every render.
 */
function ScrollRestoringBody({ children }: PropsWithChildren): React.JSX.Element {
  const scroll = useContext(ScrollBodyContext);
  return (
    <Dialog.Body ref={scroll?.ref} className="settings-body" onScroll={scroll?.onScroll}>
      {children}
    </Dialog.Body>
  );
}

interface SettingsControls {
  isDarkTheme: boolean;
  showTooltips: boolean;
  showSeriesLegend: boolean;
  checked: ReadonlySet<string>;
  onToggleTheme: ToggleRowProps["onChange"];
  onToggleTooltips: ToggleRowProps["onChange"];
  onToggleSeriesLegend: ToggleRowProps["onChange"];
  toggleChecked: (ucid: string) => void;
  selectAll: (value: boolean) => void;
  removeSelected: () => void;
  /** Result line after a removal, with what undo needs; null when nothing was removed. */
  removal: { text: string; undo?: () => void } | null;
  moveSelection: ChartController["moveSelection"];
}

/** State + handlers backing the settings dialog (theme, tooltips, series legend, selection). */
function useSettingsControls(controller: ChartController): SettingsControls {
  const initial = getSettings();
  const [isDarkTheme, setIsDarkTheme] = useState(initial.isDarkTheme);
  const [showTooltips, setShowTooltips] = useState(initial.showTooltips);
  const [showSeriesLegend, setShowSeriesLegend] = useState(initial.showSeriesLegend);
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

  const onToggleSeriesLegend = (value: boolean): void => {
    setShowSeriesLegend(value);
    changeSeriesLegend(value);
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

  const moveSelection = (ucid: string, offset: -1 | 1): void => {
    controller.moveSelection(ucid, offset);
    flushSync(forceUpdate);
  };

  return {
    isDarkTheme,
    showTooltips,
    showSeriesLegend,
    checked,
    onToggleTheme,
    onToggleTooltips,
    onToggleSeriesLegend,
    toggleChecked,
    selectAll,
    removeSelected,
    removal,
    moveSelection
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
  onScrollChange,
  initialFilter = "",
  onFilterChange
}: SettingsDialogProps): React.JSX.Element {
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

  const scrollBody: ScrollBody = {
    ref: bodyRef,
    onScroll: event => {
      onScrollChange?.(event.currentTarget.scrollTop);
    }
  };

  return (
    <ScrollBodyContext.Provider value={scrollBody}>
      <Dialog title="Chart settings" onClose={onClose} renderBody={ScrollRestoringBody}>
        {/* Mounted before it has text, so a screen reader announces the result when it fills. */}
        <div aria-live="polite" className="settings-status">
          {status && (
            <Banner
              title="Result"
              hideTitle
              variant="info"
              description={status}
              primaryAction={
                controls.removal?.undo && (
                  <Banner.PrimaryAction onClick={controls.removal.undo}>Undo</Banner.PrimaryAction>
                )
              }
            />
          )}
        </div>
        <Stack as="ul" gap="normal" className="general-settings">
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
          <ToggleRow
            label="Show series legend"
            checked={controls.showSeriesLegend}
            onChange={controls.onToggleSeriesLegend}
          />
        </Stack>

        {selections.length > 0 && (
          <DisplayedIndicators
            selections={selections}
            checked={controls.checked}
            onToggle={controls.toggleChecked}
            onSelectAll={controls.selectAll}
            onRemove={controls.removeSelected}
            onEdit={onEditIndicator}
            onMove={controls.moveSelection}
            shareUrl={() => controller.shareUrl()}
          />
        )}

        <AvailableIndicators
          listings={controller.listings}
          onPick={onPickIndicator}
          initialFilter={initialFilter}
          onFilterChange={onFilterChange}
        />
      </Dialog>
    </ScrollBodyContext.Provider>
  );
}
