import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NotFound } from "./NotFound";

describe("NotFound", () => {
  it("renders the 404 message and sets noindex meta", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Your strategy was unprofitable."
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Page not found");

    const robots = document.head.querySelector("meta[name='robots']");
    expect(robots?.getAttribute("content")).toBe("noindex, nofollow");
  });
});
