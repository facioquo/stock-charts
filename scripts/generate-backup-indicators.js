#!/usr/bin/env node
// Simple snapshot generator: fetch /indicators and persist raw JSON identical to API response.
// Intentionally minimal per request to avoid overengineering.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_API_BASE = process.env.BACKUP_INDICATORS_API_BASE || "https://localhost:5001";
const apiBase =
  process.argv.find(a => a.startsWith("--apiBase="))?.split("=")[1] || DEFAULT_API_BASE;
const dataDir = path.resolve(__dirname, "../client/src/app/data");
const jsonPath = path.join(dataDir, "backup-indicators.json");

// Allow local development against self-signed localhost certificates.
// This is intentionally limited to localhosts to avoid weakening TLS globally.
if (apiBase.startsWith("https://localhost") || apiBase.startsWith("https://127.0.0.1")) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

async function fetchListings() {
  const url = `${apiBase.replace(/\/$/, "")}/indicators`;
  const res = await fetch(url, { headers: { Accept: "application/json" } }).catch(e => {
    throw new Error(e.message);
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Strip server origin from endpoint URLs so backup listings use relative paths.
 * `buildApiUrl()` in the Angular client uses `new URL(endpoint, baseUrl)`, which
 * ignores `baseUrl` when `endpoint` is already an absolute URL — causing production
 * requests to hit localhost instead of the configured API origin.
 * Extracts pathname from any absolute URL; leaves relative paths unchanged.
 */
function normalizeEndpoints(listings) {
  return listings.map(listing => {
    try {
      const url = new URL(listing.endpoint);
      return { ...listing, endpoint: url.pathname + url.search + url.hash };
    } catch {
      return listing; // already relative, leave as-is
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  (async () => {
    console.log(`Fetching indicator listings from: ${apiBase}/indicators`);
    try {
      const raw = await fetchListings();
      const listings = normalizeEndpoints(raw);
      // Ensure output directory exists before writing snapshot
      fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(jsonPath, JSON.stringify(listings, null, 2), "utf8");
      console.log("Snapshot refreshed from API:", jsonPath);
    } catch (err) {
      if (fs.existsSync(jsonPath)) {
        console.warn("Fetch failed, keeping existing snapshot:", err.message);
        // Keep existing JSON only. Wrapper removed.
      } else {
        console.error("Fetch failed and no existing snapshot is present:", err.message);
        process.exit(1);
      }
      console.log("Error:", err);
    }
  })();
}
