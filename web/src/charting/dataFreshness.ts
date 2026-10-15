/** Days (24 h periods) the newest bar may trail now before the data counts as stale: covers a long weekend. */
export const STALE_AFTER_DAYS = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The newest bar's UTC date (`YYYY-MM-DD`; daily bars stamp the session's date at 04:00-05:00Z) when it trails `now` by more than
 * {@link STALE_AFTER_DAYS}; otherwise `null`. An empty or unparsable history is
 * not reported, since there is no date to name.
 */
export function staleDataDate(
  lastTimestamp: Date | string | undefined,
  now: Date = new Date()
): string | null {
  if (lastTimestamp === undefined) return null;
  const last = new Date(lastTimestamp);
  if (Number.isNaN(last.getTime())) return null;
  return now.getTime() - last.getTime() > STALE_AFTER_DAYS * DAY_MS
    ? last.toISOString().slice(0, 10)
    : null;
}
