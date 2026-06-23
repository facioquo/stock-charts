import { useId, useMemo, useState } from "react";

import { describeApiError } from "../../api/apiClient";
import type { ChartController } from "../../charting/chartController";
import type { IndicatorListing, IndicatorParam, IndicatorSelection } from "../../types/chart.types";

import { ColorSwatchPicker } from "./ColorSwatchPicker";
import {
  getLineSample,
  isValidHexColor,
  lineTypes,
  lineWidths,
  presetColors,
  userSpecifiedWidth
} from "./indicatorStyles";
import { Modal } from "./Modal";

interface PickConfigDialogProps {
  listing: IndicatorListing;
  controller: ChartController;
  onClose: () => void;
}

type TabId = "params" | "styles";
type ResultPatch = Partial<
  Pick<IndicatorSelection["results"][number], "color" | "lineType" | "lineWidth">
>;

function paramInvalid(param: IndicatorParam): boolean {
  const { value, minimum, maximum } = param;
  return value === undefined || Number.isNaN(value) || value < minimum || value > maximum;
}

function isFormValid(selection: IndicatorSelection, showStyles: boolean): boolean {
  const paramsValid = selection.params.every(p => !paramInvalid(p));
  const colorsValid =
    !showStyles || selection.results.every(r => r.lineType === "none" || isValidHexColor(r.color));
  return paramsValid && colorsValid;
}

interface DialogTabsProps {
  tab: TabId;
  hasParams: boolean;
  showStyles: boolean;
  onSelect: (tab: TabId) => void;
}

/** Tab strip switching between the params and styles panels. */
function DialogTabs({ tab, hasParams, showStyles, onSelect }: DialogTabsProps): React.JSX.Element {
  const renderTab = (id: TabId, label: string): React.JSX.Element => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === id}
      className={tab === id ? "dialog-tab active" : "dialog-tab"}
      onClick={() => onSelect(id)}
    >
      {label}
    </button>
  );
  return (
    <div className="dialog-tabs" role="tablist">
      {hasParams && renderTab("params", "Params")}
      {showStyles && renderTab("styles", "Styles")}
    </div>
  );
}

interface ParamsPanelProps {
  params: readonly IndicatorParam[];
  onUpdate: (index: number, raw: string) => void;
}

/** Editable list of the indicator's numeric parameters with range validation. */
function ParamsPanel({ params, onUpdate }: ParamsPanelProps): React.JSX.Element {
  return (
    <div className="param-container">
      {params.map((p, i) => {
        const invalid = paramInvalid(p);
        return (
          <div key={p.paramName} className="param-input">
            <label className="field-label" htmlFor={`param-${i}`}>
              {p.displayName}
            </label>
            <input
              id={`param-${i}`}
              type="number"
              required
              min={p.minimum}
              max={p.maximum}
              aria-invalid={invalid}
              value={p.value ?? ""}
              onChange={event => onUpdate(i, event.target.value)}
            />
            {invalid && (
              <p className="field-error">
                Valid range is {p.minimum} to {p.maximum}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface SelectOption {
  value: string | number;
  name: string;
}

interface LabeledSelectProps {
  id: string;
  label: string;
  value: string | number;
  disabled?: boolean;
  options: readonly SelectOption[];
  onChange: (rawValue: string) => void;
}

/** A labelled `<select>` populated from `{ value, name }` options. */
function LabeledSelect({
  id,
  label,
  value,
  disabled = false,
  options,
  onChange
}: LabeledSelectProps): React.JSX.Element {
  return (
    <div className="style-input">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <select id={id} value={value} disabled={disabled} onChange={e => onChange(e.target.value)}>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}

interface StyleRowProps {
  result: IndicatorSelection["results"][number];
  index: number;
  onUpdate: (index: number, patch: ResultPatch) => void;
}

/** Line-type / width / color controls for a single indicator result series. */
function StyleRow({ result, index, onUpdate }: StyleRowProps): React.JSX.Element {
  const widthDisabled = !userSpecifiedWidth(result.lineType);
  const colorDisabled = result.lineType === "none";
  return (
    <div className="style-container">
      <h3>{result.displayName}</h3>

      <LabeledSelect
        id={`linetype-${index}`}
        label="Line type"
        value={result.lineType}
        options={lineTypes}
        onChange={value => onUpdate(index, { lineType: value })}
      />

      <LabeledSelect
        id={`linewidth-${index}`}
        label="Line width"
        value={result.lineWidth}
        disabled={widthDisabled}
        options={lineWidths}
        onChange={value => onUpdate(index, { lineWidth: Number(value) })}
      />

      <ColorSwatchPicker
        value={result.color}
        presetColors={presetColors}
        disabled={colorDisabled}
        onChange={hex => onUpdate(index, { color: hex })}
      />

      <div className="line-sample" style={getLineSample(result)} aria-hidden="true" />
    </div>
  );
}

interface StylesPanelProps {
  results: readonly IndicatorSelection["results"][number][];
  onUpdate: (index: number, patch: ResultPatch) => void;
}

/** Per-series style controls for the indicator. */
function StylesPanel({ results, onUpdate }: StylesPanelProps): React.JSX.Element {
  return (
    <div className="styles-container">
      {results.map((r, i) => (
        <StyleRow key={r.dataName} result={r} index={i} onUpdate={onUpdate} />
      ))}
    </div>
  );
}

interface PickConfigState {
  selection: IndicatorSelection;
  hasParams: boolean;
  showStyles: boolean;
  tab: TabId;
  setTab: (tab: TabId) => void;
  formValid: boolean;
  errorMessage: string | undefined;
  submitting: boolean;
  closeLabel: string;
  updateParam: (index: number, raw: string) => void;
  updateResult: (index: number, patch: ResultPatch) => void;
  handleSubmit: () => Promise<void>;
}

/** State + handlers backing the indicator config dialog. */
function usePickConfig(
  listing: IndicatorListing,
  controller: ChartController,
  onClose: () => void
): PickConfigState {
  const [selection, setSelection] = useState<IndicatorSelection>(() =>
    controller.defaultSelection(listing.uiid)
  );
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [closeLabel, setCloseLabel] = useState("ADD");

  const hasParams = selection.params.length > 0;
  const showStyles = listing.category !== "candlestick-pattern";
  const [tab, setTab] = useState<TabId>(hasParams ? "params" : "styles");

  const formValid = useMemo(() => isFormValid(selection, showStyles), [selection, showStyles]);

  const updateParam = (index: number, raw: string): void => {
    setSelection(prev => ({
      ...prev,
      params: prev.params.map((p, i) =>
        i === index ? { ...p, value: raw === "" ? undefined : Number(raw) } : p
      )
    }));
  };

  const updateResult = (index: number, patch: ResultPatch): void => {
    setSelection(prev => ({
      ...prev,
      results: prev.results.map((r, i) => (i === index ? { ...r, ...patch } : r))
    }));
  };

  const handleSubmit = async (): Promise<void> => {
    setSubmitting(true);
    try {
      await controller.addSelection(selection, listing);
      setErrorMessage(undefined);
      onClose();
    } catch (error) {
      console.error("Error adding selection to chart:", error);
      setErrorMessage(describeApiError(error));
      setCloseLabel("RETRY");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    selection,
    hasParams,
    showStyles,
    tab,
    setTab,
    formValid,
    errorMessage,
    submitting,
    closeLabel,
    updateParam,
    updateResult,
    handleSubmit
  };
}

interface DialogActionsProps {
  closeLabel: string;
  disabled: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

/** Cancel / submit footer for the config dialog. */
function DialogActions({
  closeLabel,
  disabled,
  onClose,
  onSubmit
}: DialogActionsProps): React.JSX.Element {
  return (
    <div className="dialog-actions">
      <button type="button" className="btn-text" onClick={onClose}>
        CANCEL
      </button>
      <button type="button" className="btn-raised btn-warn" disabled={disabled} onClick={onSubmit}>
        {closeLabel}
      </button>
    </div>
  );
}

/** Inline validation / submit error message block. */
function DialogError({ message }: { message: string }): React.JSX.Element {
  return (
    <div className="dialog-error">
      <p>
        <small>Please correct the following error:</small>
      </p>
      <p className="error">{message}</p>
    </div>
  );
}

/**
 * Port of `PickConfigComponent`: configures an indicator's parameters and line
 * styles, then adds it to the chart. Replaces Angular Material tabs / form
 * fields / color picker with native controls and {@link ColorSwatchPicker}.
 */
export function PickConfigDialog({
  listing,
  controller,
  onClose
}: PickConfigDialogProps): React.JSX.Element {
  const titleId = useId();
  const cfg = usePickConfig(listing, controller, onClose);

  return (
    <Modal open onClose={onClose} labelledBy={titleId} className="pick-config-dialog">
      <h2 id={titleId} className="dialog-title noselect" title={listing.name}>
        {listing.name}
      </h2>

      <DialogTabs
        tab={cfg.tab}
        hasParams={cfg.hasParams}
        showStyles={cfg.showStyles}
        onSelect={cfg.setTab}
      />

      <div className="dialog-body">
        {cfg.hasParams && cfg.tab === "params" && (
          <ParamsPanel params={cfg.selection.params} onUpdate={cfg.updateParam} />
        )}

        {cfg.showStyles && cfg.tab === "styles" && (
          <StylesPanel results={cfg.selection.results} onUpdate={cfg.updateResult} />
        )}

        {cfg.errorMessage && <DialogError message={cfg.errorMessage} />}
      </div>

      <DialogActions
        closeLabel={cfg.closeLabel}
        disabled={!cfg.formValid || cfg.submitting}
        onClose={onClose}
        onSubmit={() => void cfg.handleSubmit()}
      />
    </Modal>
  );
}
