import type { IndicatorListing } from "../../types/chart.types";
import { categoryLabel } from "./categoryLabel";

/**
 * Listings whose name, id, or category label holds every word of `query`, ignoring case.
 * A blank query keeps every listing.
 */
export function filterListings(
  listings: readonly IndicatorListing[],
  query: string
): readonly IndicatorListing[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return listings;
  return listings.filter(listing => {
    const text = `${listing.name} ${listing.uiid} ${categoryLabel(listing.category)}`.toLowerCase();
    return words.every(word => text.includes(word));
  });
}
