import { useEffect, useId, useRef, useState } from "react";

import { isValidHexColor } from "./indicatorStyles";

interface ColorSwatchPickerProps {
  value: string;
  presetColors: readonly string[];
  disabled?: boolean;
  label?: string;
  onChange: (hex: string) => void;
}

interface SwatchGridProps {
  value: string;
  presetColors: readonly string[];
  onSelect: (hex: string) => void;
}

/** Close the popup when a pointer-down lands outside `ref` while `open`. */
function useDismissOnOutsideClick(
  ref: React.RefObject<HTMLElement | null>,
  open: boolean,
  onDismiss: () => void
): void {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent): void => {
      if (!ref.current?.contains(event.target as Node)) onDismiss();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [ref, open, onDismiss]);
}

interface HexInputRowProps {
  inputId: string;
  value: string;
  disabled: boolean;
  invalid: boolean;
  open: boolean;
  onChange: (hex: string) => void;
  onToggle: () => void;
}

/** Hex text field plus the swatch-popup toggle button. */
function HexInputRow({
  inputId,
  value,
  disabled,
  invalid,
  open,
  onChange,
  onToggle
}: HexInputRowProps): React.JSX.Element {
  return (
    <div className="color-input-row">
      <input
        id={inputId}
        type="text"
        className={invalid ? "color-hex-input invalid" : "color-hex-input"}
        value={value}
        disabled={disabled}
        aria-invalid={invalid}
        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8})$"
        onChange={event => onChange(event.target.value)}
      />
      <button
        type="button"
        className="color-toggle"
        disabled={disabled}
        aria-label="choose color"
        aria-haspopup="true"
        aria-expanded={open}
        style={{ backgroundColor: isValidHexColor(value) ? value : "transparent" }}
        onClick={onToggle}
      />
    </div>
  );
}

/** Toggleable grid of preset color swatches rendered below the hex input. */
function SwatchGrid({ value, presetColors, onSelect }: SwatchGridProps): React.JSX.Element {
  return (
    <div className="swatch-grid" role="listbox" aria-label="preset colors">
      {presetColors.map(color => (
        <button
          key={color}
          type="button"
          role="option"
          aria-selected={color.toUpperCase() === value.toUpperCase()}
          className="swatch"
          title={color}
          style={{ backgroundColor: color }}
          onClick={() => onSelect(color)}
        />
      ))}
    </div>
  );
}

/**
 * Dependency-free replacement for the Angular `ngx-color` compact picker:
 * a validated hex text input plus a toggleable grid of preset swatches.
 * Reproduces the original 17-swatch Material palette UX without pulling in the
 * unmaintained `react-color` package.
 */
export function ColorSwatchPicker({
  value,
  presetColors,
  disabled = false,
  label = "Color",
  onChange
}: ColorSwatchPickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const invalid = !isValidHexColor(value);

  useDismissOnOutsideClick(containerRef, open, () => setOpen(false));

  const selectSwatch = (hex: string): void => {
    onChange(hex.toUpperCase());
    setOpen(false);
  };

  return (
    <div className="color-field" ref={containerRef}>
      <label className="field-label" htmlFor={inputId}>
        {label}
      </label>
      <HexInputRow
        inputId={inputId}
        value={value}
        disabled={disabled}
        invalid={invalid}
        open={open}
        onChange={onChange}
        onToggle={() => setOpen(prev => !prev)}
      />
      {invalid && !disabled && <p className="field-error">Invalid HEX color</p>}
      {open && !disabled && (
        <SwatchGrid value={value} presetColors={presetColors} onSelect={selectSwatch} />
      )}
    </div>
  );
}
