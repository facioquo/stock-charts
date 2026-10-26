import { useMemo, useState } from "react";
import {
  Banner,
  Dialog,
  FormControl,
  Heading,
  SegmentedControl,
  Select,
  Stack,
  TextInput,
  useConfirm
} from "@primer/react";

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
} from "../../charting/indicatorStyles";

interface PickConfigDialogProps {
  listing: IndicatorListing;
  controller: ChartController;
  /** A displayed selection to edit in place; omit to add a new indicator. */
  selection?: IndicatorSelection;
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

/** The user-editable values, compared to tell whether the form holds unsaved edits. */
function editSignature(selection: IndicatorSelection): string {
  return JSON.stringify([
    selection.params.map(p => p.value),
    selection.results.map(r => [r.color, r.lineType, r.lineWidth])
  ]);
}

interface DialogTabsProps {
  tab: TabId;
  onSelect: (tab: TabId) => void;
}

const TAB_IDS: readonly TabId[] = ["params", "styles"];

/** Switches between the params and styles panels, when the indicator has both. */
function DialogTabs({ tab, onSelect }: DialogTabsProps): React.JSX.Element {
  return (
    <SegmentedControl
      aria-label="Indicator settings"
      fullWidth
      onChange={index => {
        const next = TAB_IDS[index];
        if (next) onSelect(next);
      }}
    >
      <SegmentedControl.Button selected={tab === "params"}>Params</SegmentedControl.Button>
      <SegmentedControl.Button selected={tab === "styles"}>Styles</SegmentedControl.Button>
    </SegmentedControl>
  );
}

interface ParamsPanelProps {
  params: readonly IndicatorParam[];
  onUpdate: (index: number, raw: string) => void;
}

/** Editable list of the indicator's numeric parameters with range validation. */
function ParamsPanel({ params, onUpdate }: ParamsPanelProps): React.JSX.Element {
  return (
    <Stack gap="normal" className="param-container">
      {params.map((p, i) => {
        const invalid = paramInvalid(p);
        return (
          <FormControl key={p.paramName}>
            <FormControl.Label>{p.displayName}</FormControl.Label>
            <TextInput
              type="number"
              block
              min={p.minimum}
              max={p.maximum}
              validationStatus={invalid ? "error" : undefined}
              aria-invalid={invalid}
              value={p.value ?? ""}
              onChange={event => onUpdate(i, event.target.value)}
            />
            {invalid && (
              <FormControl.Validation variant="error">
                Valid range is {p.minimum} to {p.maximum}
              </FormControl.Validation>
            )}
          </FormControl>
        );
      })}
    </Stack>
  );
}

interface SelectOption {
  value: string | number;
  name: string;
}

interface LabeledSelectProps {
  label: string;
  value: string | number;
  disabled?: boolean;
  options: readonly SelectOption[];
  onChange: (rawValue: string) => void;
}

/** A labelled Primer `Select` populated from `{ value, name }` options. */
function LabeledSelect({
  label,
  value,
  disabled = false,
  options,
  onChange
}: LabeledSelectProps): React.JSX.Element {
  return (
    <FormControl disabled={disabled}>
      <FormControl.Label>{label}</FormControl.Label>
      <Select value={String(value)} disabled={disabled} onChange={e => onChange(e.target.value)}>
        {options.map(option => (
          <Select.Option key={option.value} value={String(option.value)}>
            {option.name}
          </Select.Option>
        ))}
      </Select>
    </FormControl>
  );
}

interface StyleRowProps {
  result: IndicatorSelection["results"][number];
  index: number;
  onUpdate: (index: number, patch: ResultPatch) => void;
}

/** Line-type and line-width selects for a result series. */
function StyleSelects({ result, index, onUpdate }: StyleRowProps): React.JSX.Element {
  return (
    <>
      <LabeledSelect
        label="Line type"
        value={result.lineType}
        options={lineTypes}
        onChange={value => onUpdate(index, { lineType: value })}
      />
      <LabeledSelect
        label="Line width"
        value={result.lineWidth}
        disabled={!userSpecifiedWidth(result.lineType)}
        options={lineWidths}
        onChange={value => onUpdate(index, { lineWidth: Number(value) })}
      />
    </>
  );
}

/** Color picker plus the rendered line-style preview for a result series. */
function StyleColor({ result, index, onUpdate }: StyleRowProps): React.JSX.Element {
  return (
    <>
      <ColorSwatchPicker
        value={result.color}
        presetColors={presetColors}
        disabled={result.lineType === "none"}
        onChange={hex => onUpdate(index, { color: hex })}
      />
      <div className="line-sample" style={getLineSample(result)} aria-hidden="true" />
    </>
  );
}

/** Line-type / width / color controls for a single indicator result series. */
function StyleRow({ result, index, onUpdate }: StyleRowProps): React.JSX.Element {
  return (
    <Stack as="section" gap="condensed" className="style-container">
      <Heading as="h3" variant="small">
        {result.displayName}
      </Heading>
      <div className="style-inputs">
        <StyleSelects result={result} index={index} onUpdate={onUpdate} />
        <StyleColor result={result} index={index} onUpdate={onUpdate} />
      </div>
    </Stack>
  );
}

interface StylesPanelProps {
  results: readonly IndicatorSelection["results"][number][];
  onUpdate: (index: number, patch: ResultPatch) => void;
}

/** Per-series style controls for the indicator. */
function StylesPanel({ results, onUpdate }: StylesPanelProps): React.JSX.Element {
  return (
    <Stack gap="spacious">
      {results.map((r, i) => (
        <StyleRow key={r.dataName} result={r} index={i} onUpdate={onUpdate} />
      ))}
    </Stack>
  );
}

interface PickConfigState {
  selection: IndicatorSelection;
  hasParams: boolean;
  showStyles: boolean;
  tab: TabId;
  setTab: (tab: TabId) => void;
  formValid: boolean;
  /** The form differs from what it opened with. */
  dirty: boolean;
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
  onClose: () => void,
  existing?: IndicatorSelection
): PickConfigState {
  // Edit a copy so cancelling leaves the displayed selection untouched.
  const [selection, setSelection] = useState<IndicatorSelection>(() =>
    existing
      ? {
          ...existing,
          params: existing.params.map(p => ({ ...p })),
          results: existing.results.map(r => ({ ...r }))
        }
      : controller.defaultSelection(listing.uiid)
  );
  const [opened] = useState(() => editSignature(selection));
  const dirty = editSignature(selection) !== opened;
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [closeLabel, setCloseLabel] = useState(existing ? "Save" : "Add");

  const hasParams = selection.params.length > 0;
  // Style controls are hidden where they'd be no-ops: candlestick-pattern
  // markers and candle-rendered results (e.g. Heikin-Ashi) both take their
  // colors from fixed pattern/theme rules, not per-result settings. The
  // length guard keeps listings with no results (vacuous `every`) styleable.
  const candleOnly =
    listing.results.length > 0 && listing.results.every(r => r.lineType === "candle");
  const showStyles = listing.category !== "candlestick-pattern" && !candleOnly;
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
      if (existing) {
        await controller.updateSelection(existing.ucid, selection, listing);
      } else {
        await controller.addSelection(selection, listing);
      }
      setErrorMessage(undefined);
      onClose();
    } catch (error) {
      console.error("Error adding selection to chart:", error);
      setErrorMessage(describeApiError(error));
      setCloseLabel("Retry");
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
    dirty,
    errorMessage,
    submitting,
    closeLabel,
    updateParam,
    updateResult,
    handleSubmit
  };
}

/**
 * Configures an indicator's parameters and line styles, then adds it to the
 * chart, or saves the edits to a displayed one. Closing with unsaved edits asks
 * first, so a stray Escape or backdrop click does not lose them.
 */
export function PickConfigDialog({
  listing,
  controller,
  selection,
  onClose
}: PickConfigDialogProps): React.JSX.Element {
  const cfg = usePickConfig(listing, controller, onClose, selection);
  const confirm = useConfirm();

  const requestClose = async (): Promise<void> => {
    if (
      cfg.dirty &&
      !(await confirm({
        title: "Discard changes?",
        content: "Your edits to this indicator will be lost.",
        confirmButtonContent: "Discard",
        confirmButtonType: "danger"
      }))
    )
      return;
    onClose();
  };

  return (
    <Dialog
      title={listing.name}
      onClose={() => void requestClose()}
      footerButtons={[
        { content: "Cancel", onClick: () => void requestClose() },
        {
          content: cfg.closeLabel,
          buttonType: "primary",
          disabled: !cfg.formValid || cfg.submitting,
          loading: cfg.submitting,
          onClick: () => void cfg.handleSubmit()
        }
      ]}
    >
      <Stack gap="normal">
        {cfg.hasParams && cfg.showStyles && <DialogTabs tab={cfg.tab} onSelect={cfg.setTab} />}

        {cfg.hasParams && cfg.tab === "params" && (
          <ParamsPanel params={cfg.selection.params} onUpdate={cfg.updateParam} />
        )}

        {cfg.showStyles && cfg.tab === "styles" && (
          <StylesPanel results={cfg.selection.results} onUpdate={cfg.updateResult} />
        )}

        {cfg.errorMessage && (
          <Banner
            title="Could not apply the indicator"
            variant="critical"
            role="alert"
            description={cfg.errorMessage}
          />
        )}
      </Stack>
    </Dialog>
  );
}
