import { createDefaultSelection } from "@facioquo/indy-charts";

import { isValidHexColor, lineTypes, lineWidths } from "./indicatorStyles";
import type { IndicatorListing, IndicatorSelection } from "../types/chart.types";

/** Query parameter that carries the encoded selections. */
export const SHARE_PARAM = "c";

/** A link longer than this is ignored; real links are a few hundred characters. */
const MAX_ENCODED_LENGTH = 8192;

/** An upper bound on indicators in a link; each one costs the visitor an API request. */
const MAX_ENTRIES = 50;

/** Encoding version, the prefix before the first dot. Bump when the payload shape changes. */
const VERSION = "1";

/**
 * Payload for version 1: one entry per selection, in display order.
 * `[uiid, params, styles]`. Parameters are `[paramName, value]` pairs and
 * styles `[dataName, color, lineType, lineWidth]`, only for results that differ
 * from the listing default. Both are keyed by name rather than position, so a
 * catalog that reorders or adds a parameter or result does not shift a shared
 * link's values.
 */
type ParamPair = [string, number];
type StylePair = [string, string, string, number];
type Entry = [string, ParamPair[], StylePair[]];

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
}

/** Encodes selections as `<version>.<payload>`; selections with no known listing are left out. */
export function encodeSelections(
  selections: readonly IndicatorSelection[],
  listings: readonly IndicatorListing[]
): string {
  const entries: Entry[] = selections.flatMap(selection => {
    const listing = listings.find(x => x.uiid === selection.uiid);
    if (!listing) return [];
    const defaults = createDefaultSelection(listing);
    const params = selection.params.map((param): ParamPair => [param.paramName, param.value ?? 0]);
    const styles = selection.results.flatMap((result, index): StylePair[] => {
      const base = defaults.results.at(index);
      return base &&
        base.color === result.color &&
        base.lineType === result.lineType &&
        base.lineWidth === result.lineWidth
        ? []
        : [[result.dataName, result.color, result.lineType, result.lineWidth]];
    });
    return [[selection.uiid, params, styles]];
  });
  return `${VERSION}.${toBase64Url(JSON.stringify(entries))}`;
}

/** A style is applied only if the settings dialog could have produced it. */
function isStyle(value: unknown): value is StylePair {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    typeof value[0] === "string" &&
    typeof value[1] === "string" &&
    isValidHexColor(value[1]) &&
    lineTypes.some(option => option.value === value[2]) &&
    lineWidths.some(option => option.value === value[3])
  );
}

function isParamPair(value: unknown): value is ParamPair {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "string" &&
    typeof value[1] === "number"
  );
}

function decodeEntry(entry: unknown, listings: readonly IndicatorListing[]): IndicatorSelection[] {
  if (!Array.isArray(entry) || typeof entry[0] !== "string") return [];
  const [uiid, pairs, styles] = entry as [string, unknown, unknown];
  const listing = listings.find(x => x.uiid === uiid);
  if (!listing || !Array.isArray(pairs)) return [];

  const values = new Map(pairs.filter(isParamPair));
  const overrides: Record<string, number> = {};
  for (const config of listing.parameters ?? []) {
    const value = values.get(config.paramName);
    if (value === undefined || !Number.isFinite(value)) continue;
    if (config.dataType === "int" && !Number.isInteger(value)) continue;
    if (value < config.minimum || value > config.maximum) continue;
    overrides[config.paramName] = value;
  }

  const selection = createDefaultSelection(listing, overrides);
  if (Array.isArray(styles)) {
    for (const style of styles.filter(isStyle)) {
      const result = selection.results.find(x => x.dataName === style[0]);
      if (result) [, result.color, result.lineType, result.lineWidth] = style;
    }
  }
  return [selection];
}

/**
 * Decodes a share parameter into selections. Returns `[]` for an unknown
 * version or an unreadable payload, and skips entries whose indicator is not in
 * the catalog; an out-of-range parameter or an unsupported style falls back to
 * its default. Oversized links, repeated entries, and entries past a cap are dropped.
 */
export function decodeSelections(
  encoded: string,
  listings: readonly IndicatorListing[]
): IndicatorSelection[] {
  if (encoded.length > MAX_ENCODED_LENGTH) return [];
  const dot = encoded.indexOf(".");
  if (dot < 0 || encoded.slice(0, dot) !== VERSION) return [];
  try {
    const payload: unknown = JSON.parse(fromBase64Url(encoded.slice(dot + 1)));
    if (!Array.isArray(payload)) return [];
    const unique = [...new Set(payload.map(entry => JSON.stringify(entry)))];
    return unique.slice(0, MAX_ENTRIES).flatMap(entry => decodeEntry(JSON.parse(entry), listings));
  } catch {
    return [];
  }
}

/** The current page address with the selections encoded into {@link SHARE_PARAM}. */
export function buildShareUrl(
  selections: readonly IndicatorSelection[],
  listings: readonly IndicatorListing[],
  location: Pick<Location, "origin" | "pathname"> = window.location
): string {
  const url = new URL(location.pathname, location.origin);
  url.searchParams.set(SHARE_PARAM, encodeSelections(selections, listings));
  return url.toString();
}
