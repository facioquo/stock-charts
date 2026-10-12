const labels = new Map<string, string>(
  Object.entries({
    "candlestick-pattern": "Candlestick patterns",
    "moving-average": "Moving averages",
    "oscillator": "Oscillators",
    "price-channel": "Price channels",
    "price-characteristic": "Price characteristics",
    "price-pattern": "Price patterns",
    "price-transform": "Price transforms",
    "price-trend": "Price trends",
    "stop-and-reverse": "Stop and reverse",
    "volume-based": "Volume-based"
  })
);

/** Catalog category slugs that have a display label. */
export const labelledCategories: readonly string[] = [...labels.keys()];

/** Human label for a catalog category slug; an unknown slug falls back to sentence case. */
export function categoryLabel(slug: string): string {
  const known = labels.get(slug);
  if (known) return known;
  const words = slug.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
