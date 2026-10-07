/**
 * Static-snapshot path mapping shared by the client's offline fallback and the
 * snapshot generator, so the files a producer writes are the files a consumer
 * reads.
 */

/**
 * Escapes a query name or value for use in a file name. `encodeURIComponent`
 * alone writes `%XX`, which a static host decodes before it looks for the file,
 * so the escape character here is `~`. `~` and `*` (not a legal file name
 * character on Windows) are escaped first, which keeps the mapping unambiguous.
 */
function fileSafe(value: string): string {
  return encodeURIComponent(value)
    .replaceAll("~", "~7E")
    .replaceAll("*", "~2A")
    .replaceAll("%", "~");
}

/**
 * Maps a resolved API request URL to its snapshot file path, relative to the
 * snapshot root.
 *
 * - The API base path is stripped, so a snapshot does not depend on where the
 *   API is mounted.
 * - No query: `<path>.json`, e.g. `quotes.json`, `SMA.json`.
 * - Query: `<path>/<query>.json`, with parameters sorted by name and
 *   escaped with {@link fileSafe}, e.g. `SMA/lookbackPeriods=20.json`.
 */
export function offlineSnapshotPath(apiBaseUrl: string, requestUrl: string): string {
  const base = new URL(apiBaseUrl);
  const url = new URL(requestUrl);
  const basePath = base.pathname.endsWith("/") ? base.pathname : `${base.pathname}/`;
  const relative = url.pathname.startsWith(basePath)
    ? url.pathname.slice(basePath.length)
    : url.pathname;
  const path = relative.replace(/^\/+|\/+$/g, "");

  const query = [...url.searchParams.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([name, value]) => `${fileSafe(name)}=${fileSafe(value)}`)
    .join("&");

  return query ? `${path}/${query}.json` : `${path}.json`;
}

/** Where to read one snapshot file: the file the live request for `requestUrl` would have been answered from. */
export interface FetchOfflineSnapshotOptions {
  /** Root URL of the snapshot files, as in `offlineFallback.baseUrl`. */
  snapshotBaseUrl: string;
  /** The API base URL the client is configured with; the snapshot path is relative to it. */
  apiBaseUrl: string;
  /** The absolute URL the live client would request, query string included, under `apiBaseUrl`. */
  requestUrl: string;
}

/**
 * Reads one snapshot file without a live request and returns its parsed JSON. The result is
 * `undefined` when the file is missing, cannot be fetched or parsed, or the URLs do not parse,
 * for example during server-side rendering, where a relative root does not resolve. The type
 * is `unknown`: the caller validates the shape.
 */
export async function fetchOfflineSnapshot(options: FetchOfflineSnapshotOptions): Promise<unknown> {
  const { snapshotBaseUrl, apiBaseUrl, requestUrl } = options;
  const root = snapshotBaseUrl.replace(/\/+$/, "");
  try {
    const response = await fetch(`${root}/${offlineSnapshotPath(apiBaseUrl, requestUrl)}`);
    if (!response.ok) return undefined;
    return (await response.json()) as unknown;
  } catch {
    return undefined;
  }
}
