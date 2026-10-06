import { createDefaultSelection } from "../helpers/create-default-selection";
import type { IndicatorSelection } from "../config/types";
import {
  createApiClient,
  listingsRequestUrl,
  quotesRequestUrl,
  selectionRequestUrl,
  type ApiClientConfig
} from "./client";
import { offlineSnapshotPath } from "./offline";

/** One snapshot file: `path` is relative to the snapshot root; `data` is its JSON content. */
export interface OfflineSnapshotFile {
  path: string;
  data: unknown;
}

export interface OfflineSnapshotOptions {
  /**
   * Selections to capture. Defaults to one selection per catalog indicator,
   * using each indicator's default parameters, which covers every chart the
   * catalog can draw out of the box. Add selections here for non-default
   * parameters a page uses.
   */
  selections?: IndicatorSelection[];
}

/**
 * Fetches the live API and returns the files {@link ApiClientConfig.offlineFallback}
 * reads, at the paths it reads them from. Write each `data` as JSON to
 * `path` under the snapshot root and serve that root from the consumer's site.
 *
 * Runs at build time against a reachable API. `config.offlineFallback` is
 * ignored here so a snapshot is never built from another snapshot.
 */
export async function createOfflineSnapshot(
  config: ApiClientConfig,
  options: OfflineSnapshotOptions = {}
): Promise<OfflineSnapshotFile[]> {
  const liveConfig = { ...config };
  delete liveConfig.offlineFallback;
  delete liveConfig.onOffline;
  // A stale copy would otherwise be baked into the snapshot.
  delete liveConfig.staleCache;
  const client = createApiClient(liveConfig);
  const [quotes, listings] = await Promise.all([client.getQuotes(), client.getListings()]);

  const file = (url: string, data: unknown): OfflineSnapshotFile => ({
    path: offlineSnapshotPath(config.baseUrl, url),
    data
  });
  const files = [
    file(quotesRequestUrl(config), quotes),
    file(listingsRequestUrl(config), listings)
  ];

  const selections = options.selections ?? listings.map(listing => createDefaultSelection(listing));
  for (const selection of selections) {
    const listing = listings.find(item => item.uiid === selection.uiid);
    if (!listing) {
      throw new Error(`No catalog listing for selection "${selection.uiid}"`);
    }
    const rows = await client.getSelectionData(selection, listing);
    files.push(file(selectionRequestUrl(config, selection, listing), rows));
  }

  return files;
}
