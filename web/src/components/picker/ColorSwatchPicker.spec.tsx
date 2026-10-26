import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ColorSwatchPicker } from "./ColorSwatchPicker";
import { presetColors } from "../../charting/indicatorStyles";

describe("ColorSwatchPicker", () => {
  it("renders the current hex value", () => {
    render(<ColorSwatchPicker value="#1E88E5" presetColors={presetColors} onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveValue("#1E88E5");
  });

  it("emits hex input edits verbatim", () => {
    const onChange = vi.fn();
    render(<ColorSwatchPicker value="#1E88E5" presetColors={presetColors} onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "#abcabc" } });
    expect(onChange).toHaveBeenCalledWith("#abcabc");
  });

  it("opens the preset menu and emits an uppercased preset on selection", async () => {
    const onChange = vi.fn();
    render(<ColorSwatchPicker value="#1E88E5" presetColors={presetColors} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "choose color" }));
    const options = await screen.findAllByRole("menuitemradio");
    expect(options).toHaveLength(presetColors.length);
    expect(screen.getByRole("menuitemradio", { name: "#1E88E5" })).toHaveAttribute(
      "aria-checked",
      "true"
    );

    fireEvent.click(screen.getByRole("menuitemradio", { name: "#DD2C00" }));
    expect(onChange).toHaveBeenCalledWith("#DD2C00");
    // the menu closes after selection
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("flags an invalid hex value", () => {
    render(<ColorSwatchPicker value="nope" presetColors={presetColors} onChange={vi.fn()} />);
    expect(screen.getByText("Invalid HEX color")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("disables interaction when disabled", () => {
    render(
      <ColorSwatchPicker value="#1E88E5" presetColors={presetColors} disabled onChange={vi.fn()} />
    );
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "choose color" })).toBeDisabled();
  });
});
