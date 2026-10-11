import { describe, expect, it } from "vitest";

import snapshot from "../../../public/data/chart-api/indicators.json";
import { categoryLabel, labelledCategories } from "./categoryLabel";

describe("categoryLabel", () => {
  it("maps catalog slugs to display labels", () => {
    expect(categoryLabel("price-channel")).toBe("Price channels");
    expect(categoryLabel("stop-and-reverse")).toBe("Stop and reverse");
  });

  it("falls back to sentence case for a slug it does not know", () => {
    expect(categoryLabel("new-category")).toBe("New category");
  });

  it("labels every category the catalog snapshot uses", () => {
    const used = new Set((snapshot as { category: string }[]).map(listing => listing.category));

    expect([...used].filter(slug => !labelledCategories.includes(slug))).toEqual([]);
  });
});
