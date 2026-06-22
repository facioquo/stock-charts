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

function paramInvalid(param: IndicatorParam): boolean {
  const { value, minimum, maximum } = param;
  return value === undefined || Number.isNaN(value) || value < minimum || value > maximum;
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
  const [selection, setSelection] = useState<IndicatorSelection>(() =>
    controller.defaultSelection(listing.uiid)
  );
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [closeLabel, setCloseLabel] = useState("ADD");

  const hasParams = selection.params.length > 0;
  const showStyles = listing.category !== "candlestick-pattern";
  const [tab, setTab] = useState<TabId>(hasParams ? "params" : "styles");

  const formValid = useMemo(() => {
    const paramsValid = selection.params.every(p => !paramInvalid(p));
    const colorsValid =
      !showStyles ||
      selection.results.every(r => r.lineType === "none" || isValidHexColor(r.color));
    return paramsValid && colorsValid;
  }, [selection, showStyles]);

  const updateParam = (index: number, raw: string): void => {
    setSelection(prev => ({
      ...prev,
      params: prev.params.map((p, i) =>
        i === index ? { ...p, value: raw === "" ? undefined : Number(raw) } : p
      )
    }));
  };

  const updateResult = (
    index: number,
    patch: Partial<Pick<IndicatorSelection["results"][number], "color" | "lineType" | "lineWidth">>
  ): void => {
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

  return (
    <Modal open onClose={onClose} labelledBy={titleId} className="pick-config-dialog">
      <h2 id={titleId} className="dialog-title noselect" title={listing.name}>
        {listing.name}
      </h2>

      <div className="dialog-tabs" role="tablist">
        {hasParams && (
          <button
            type="button"
            role="tab"
            aria-selected={tab === "params"}
            className={tab === "params" ? "dialog-tab active" : "dialog-tab"}
            onClick={() => setTab("params")}
          >
            Params
          </button>
        )}
        {showStyles && (
          <button
            type="button"
            role="tab"
            aria-selected={tab === "styles"}
            className={tab === "styles" ? "dialog-tab active" : "dialog-tab"}
            onClick={() => setTab("styles")}
          >
            Styles
          </button>
        )}
      </div>

      <div className="dialog-body">
        {hasParams && tab === "params" && (
          <div className="param-container">
            {selection.params.map((p, i) => {
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
                    onChange={event => updateParam(i, event.target.value)}
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
        )}

        {showStyles && tab === "styles" && (
          <div className="styles-container">
            {selection.results.map((r, i) => {
              const widthDisabled = !userSpecifiedWidth(r.lineType);
              const colorDisabled = r.lineType === "none";
              return (
                <div key={r.dataName} className="style-container">
                  <h3>{r.displayName}</h3>

                  <div className="style-input">
                    <label className="field-label" htmlFor={`linetype-${i}`}>
                      Line type
                    </label>
                    <select
                      id={`linetype-${i}`}
                      value={r.lineType}
                      onChange={event => updateResult(i, { lineType: event.target.value })}
                    >
                      {lineTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="style-input">
                    <label className="field-label" htmlFor={`linewidth-${i}`}>
                      Line width
                    </label>
                    <select
                      id={`linewidth-${i}`}
                      value={r.lineWidth}
                      disabled={widthDisabled}
                      onChange={event => updateResult(i, { lineWidth: Number(event.target.value) })}
                    >
                      {lineWidths.map(width => (
                        <option key={width.value} value={width.value}>
                          {width.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <ColorSwatchPicker
                    value={r.color}
                    presetColors={presetColors}
                    disabled={colorDisabled}
                    onChange={hex => updateResult(i, { color: hex })}
                  />

                  <div className="line-sample" style={getLineSample(r)} aria-hidden="true" />
                </div>
              );
            })}
          </div>
        )}

        {errorMessage && (
          <div className="dialog-error">
            <p>
              <small>Please correct the following error:</small>
            </p>
            <p className="error">{errorMessage}</p>
          </div>
        )}
      </div>

      <div className="dialog-actions">
        <button type="button" className="btn-text" onClick={onClose}>
          CANCEL
        </button>
        <button
          type="button"
          className="btn-raised btn-warn"
          disabled={!formValid || submitting}
          onClick={() => void handleSubmit()}
        >
          {closeLabel}
        </button>
      </div>
    </Modal>
  );
}
