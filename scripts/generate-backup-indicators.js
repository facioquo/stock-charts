#!/usr/bin/env node
// Simple snapshot generator: fetch /indicators and persist raw JSON identical to API response.
// Intentionally minimal per request to avoid overengineering.

const fs = require('fs');
const path = require('path');

const DEFAULT_API_BASE = process.env.BACKUP_INDICATORS_API_BASE || 'http://localhost:5000';
const apiBase = process.argv.find(a => a.startsWith('--apiBase='))?.split('=')[1] || DEFAULT_API_BASE;
const dataDir = path.resolve(__dirname, '../client/src/app/data');
const jsonPath = path.join(dataDir, 'backup-indicators.json');

async function fetchListings() {
  const url = `${apiBase.replace(/\/$/, '')}/indicators`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } }).catch(e => { throw new Error(e.message); });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

(async () => {
  console.log(`Fetching indicator listings from: ${apiBase}/indicators`);
  try {
    const listings = await fetchListings();
    fs.writeFileSync(jsonPath, JSON.stringify(listings, null, 2), 'utf8');
  console.log('Snapshot refreshed from API:', jsonPath);
  } catch (err) {
    if (fs.existsSync(jsonPath)) {
      console.warn('Fetch failed, keeping existing snapshot:', err.message);
  // Keep existing JSON only. Wrapper removed.
    } else {
      console.error('Fetch failed and no existing snapshot is present:', err.message);
      process.exit(1);
    }
  }
})();
