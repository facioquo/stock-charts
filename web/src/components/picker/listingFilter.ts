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

export interface ListingGroup {
  category: string;
  label: string;
  listings: readonly IndicatorListing[];
}

/** Listings grouped under their category label, groups ordered by label, listings kept in order. */
export function groupByCategory(listings: readonly IndicatorListing[]): ListingGroup[] {
  const groups = new Map<string, IndicatorListing[]>();
  for (const listing of listings) {
    const group = groups.get(listing.category);
    if (group) group.push(listing);
    else groups.set(listing.category, [listing]);
  }
  return [...groups]
    .map(([category, members]) => ({ category, label: categoryLabel(category), listings: members }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
