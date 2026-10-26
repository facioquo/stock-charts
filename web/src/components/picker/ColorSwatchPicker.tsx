import { ActionList, ActionMenu, FormControl, IconButton, Stack, TextInput } from "@primer/react";
import { PaintbrushIcon } from "@primer/octicons-react";

import { isValidHexColor } from "../../charting/indicatorStyles";

interface ColorSwatchPickerProps {
  value: string;
  presetColors: readonly string[];
  disabled?: boolean;
  label?: string;
  onChange: (hex: string) => void;
}

/** A filled square showing a chart color; the one custom element in the picker. */
function ColorSwatch({ color }: { color: string }): React.JSX.Element {
  return (
    <span
      className="color-swatch"
      style={{ backgroundColor: isValidHexColor(color) ? color : "transparent" }}
    />
  );
}

/**
 * A validated hex field beside a Primer `ActionMenu` of preset colors, each
 * shown with its swatch.
 */
export function ColorSwatchPicker({
  value,
  presetColors,
  disabled = false,
  label = "Color",
  onChange
}: ColorSwatchPickerProps): React.JSX.Element {
  const invalid = !isValidHexColor(value);

  return (
    <FormControl disabled={disabled}>
      <FormControl.Label>{label}</FormControl.Label>
      <Stack direction="horizontal" align="center" gap="condensed">
        <TextInput
          value={value}
          disabled={disabled}
          leadingVisual={<ColorSwatch color={value} />}
          validationStatus={invalid && !disabled ? "error" : undefined}
          aria-invalid={invalid}
          pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8})$"
          onChange={event => onChange(event.target.value)}
        />
        <ActionMenu>
          <ActionMenu.Anchor>
            <IconButton icon={PaintbrushIcon} aria-label="choose color" disabled={disabled} />
          </ActionMenu.Anchor>
          <ActionMenu.Overlay>
            <ActionList selectionVariant="single" aria-label="preset colors">
              {presetColors.map(color => (
                <ActionList.Item
                  key={color}
                  selected={color.toUpperCase() === value.toUpperCase()}
                  onSelect={() => onChange(color.toUpperCase())}
                >
                  <ActionList.LeadingVisual>
                    <ColorSwatch color={color} />
                  </ActionList.LeadingVisual>
                  {color}
                </ActionList.Item>
              ))}
            </ActionList>
          </ActionMenu.Overlay>
        </ActionMenu>
      </Stack>
      {invalid && !disabled && (
        <FormControl.Validation variant="error">Invalid HEX color</FormControl.Validation>
      )}
    </FormControl>
  );
}
