#!/usr/bin/env node
// Writes the offline snapshot the demo falls back to when its API is gone.
// Needs the built indy-charts package: pnpm --filter @facioquo/indy-charts run build

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createApiClient,
  createDefaultSelection,
  createOfflineSnapshot
} from "../libs/indy-charts/dist/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "../web/public/data/chart-api");
const baseUrl =
  process.argv.find(a => a.startsWith("--apiBase="))?.split("=")[1] ??
  process.env.INDICATORS_API_BASE ??
  "https://charts-api.stockindicators.dev";

const config = { baseUrl, retry: { maxAttempts: 3, baseDelayMs: 500 } };

// Every catalog indicator at its defaults, plus the non-default parameters the demo
// opens with (`loadDefaultSelections` in web/src/charting/chartController.ts).
const demoDefaults = [
  { uiid: "LINEAR", lookbackPeriods: 50 },
  { uiid: "RSI", lookbackPeriods: 5 }
];
const listings = await createApiClient(config).getListings();
const selections = [
  ...listings.map(listing => createDefaultSelection(listing)),
  ...demoDefaults.map(({ uiid, lookbackPeriods }) => {
    const listing = listings.find(item => item.uiid === uiid);
    if (!listing) throw new Error(`No catalog listing for "${uiid}"`);
    const selection = createDefaultSelection(listing);
    const param = selection.params.find(p => p.paramName === "lookbackPeriods");
    if (!param) throw new Error(`"${uiid}" has no lookbackPeriods parameter`);
    param.value = lookbackPeriods;
    return selection;
  })
];

const files = await createOfflineSnapshot(config, { selections });

// Listing endpoints are absolute URLs on the API origin. Relative ones resolve against
// whichever API the page is configured for, so the snapshot never points a request at
// another environment. The snapshot paths depend only on the pathname, so they hold.
for (const file of files) {
  if (file.path !== "indicators.json") continue;
  file.data = file.data.map(listing => {
    const { pathname, search } = new URL(listing.endpoint);
    return { ...listing, endpoint: pathname + search };
  });
}

// Write beside the target, then swap, so a failed write leaves the current snapshot intact.
const tempDir = `${outDir}.tmp`;
fs.rmSync(tempDir, { recursive: true, force: true });
for (const { path: relative, data } of files) {
  const target = path.resolve(tempDir, relative);
  // The library supplies `relative`; refuse anything that would leave the snapshot folder.
  if (!target.startsWith(`${tempDir}${path.sep}`)) throw new Error(`Unexpected path: ${relative}`);
  // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(data)}\n`, "utf8");
}
fs.rmSync(outDir, { recursive: true, force: true });
fs.renameSync(tempDir, outDir);
console.log(`Wrote ${files.length} snapshot files from ${baseUrl} to ${outDir}`);
