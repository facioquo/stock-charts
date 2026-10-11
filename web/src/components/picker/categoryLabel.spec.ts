import { describe, expect, it } from "vitest";
import { categoryLabel } from "./categoryLabel";

describe("categoryLabel", () => {
  it("maps catalog slugs to display labels", () => {
    expect(categoryLabel("price-channel")).toBe("Price channels");
    expect(categoryLabel("stop-and-reverse")).toBe("Stop and reverse");
  });

  it("falls back to sentence case for a slug it does not know", () => {
    expect(categoryLabel("new-category")).toBe("New category");
  });
});
