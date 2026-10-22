/** Display labels, in the order the library's indicator docs list their categories. */
const labels = new Map<string, string>(
  Object.entries({
    "price-trend": "Price trends",
    "price-channel": "Price channels",
    oscillator: "Oscillators",
    "stop-and-reverse": "Stop and reverse",
    "candlestick-pattern": "Candlestick patterns",
    "price-pattern": "Price patterns",
    "volume-based": "Volume-based",
    "moving-average": "Moving averages",
    "price-transform": "Price transforms",
    "price-characteristic": "Price characteristics"
  })
);

/** Catalog category slugs that have a display label, in docs order. */
export const labelledCategories: readonly string[] = [...labels.keys()];

/** Human label for a catalog category slug; an unknown slug falls back to sentence case. */
export function categoryLabel(slug: string): string {
  const known = labels.get(slug);
  if (known) return known;
  const words = slug.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
