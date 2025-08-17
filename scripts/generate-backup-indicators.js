#!/usr/bin/env node

/**
 * Generate client-side backup indicators from live /indicators API.
 * Falls back to server metadata parsing if API not reachable.
 * Ensures snapshot stays in sync with backend without manual edits.
 */

const fs = require('fs');
const path = require('path');

// Path to server metadata file (fallback parse target)
const serverMetadataPath = path.join(__dirname, '../server/WebApi/Services/Service.Metadata.cs');

// API base configuration (can be overridden via env or CLI)
const DEFAULT_API_BASE = process.env.BACKUP_INDICATORS_API_BASE || 'http://localhost:5000';
const apiBase = process.argv.find(a => a.startsWith('--apiBase='))?.split('=')[1] || DEFAULT_API_BASE;

// Strict, traversal‑safe construction of output path.
// NOTE: No user input is incorporated; still validate real path containment defensively.
const allowedDir = path.resolve(__dirname, '../client/src/app/data');
const outputPath = path.join(allowedDir, 'backup-indicators.ts');
const clientDataDir = path.dirname(outputPath);
const backupJsonFile = path.join(clientDataDir, 'backup-indicators.json');

function ensureInside(baseDir, targetPath) {
  const baseReal = fs.realpathSync(baseDir);
  const parent = path.dirname(targetPath);
  // Ensure parent directory exists (should already) before resolving.
  if (!fs.existsSync(parent)) {
    console.error('Expected output directory missing:', parent);
    process.exit(2);
  }
  const parentReal = fs.realpathSync(parent);
  const relative = path.relative(baseReal, parentReal);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    return; // inside
  }
  console.error('Refusing to write outside allowed directory.');
  process.exit(3);
}

ensureInside(allowedDir, outputPath);

console.log(`Generating backup indicators from API: ${apiBase}/indicators ...`);

async function fetchFromApi() {
  const url = `${apiBase.replace(/\/$/, '')}/indicators`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' }, timeout: 10000 }).catch(e => { throw new Error(`Fetch failed: ${e.message}`); });
  if (!res.ok) throw new Error(`HTTP ${res.status} when fetching ${url}`);
  return await res.json();
}

function serializeTs(listings) {
  // Produce TypeScript object literal with unquoted property keys to satisfy linting rules.
  const body = JSON.stringify(listings, null, 2)
    // Remove quotes around simple identifier property names
    .replace(/"([a-zA-Z0-9_]+)":/g, '$1:');
  return `// GENERATED FILE - DO NOT EDIT DIRECTLY\n// Regenerate with: npm run generate:backup-indicators\n// Source: ${apiBase}/indicators (fallback server metadata)\n// Purpose: Client-side failover indicator listings when API is unreachable.\n// Any manual changes will be overwritten on regeneration.\n// Trademark: Bollinger Bands® is a registered trademark of John Bollinger.\n//\nimport { IndicatorListing } from "../pages/chart/chart.models";\n\nexport const CLIENT_BACKUP_INDICATORS: IndicatorListing[] = ${body} as IndicatorListing[];\n`;
}

// Fallback: very light parse attempt of metadata file to extract display Name lines if API unavailable
function fallbackParseMetadata() {
  try {
    const cs = fs.readFileSync(serverMetadataPath, 'utf8');
    // Extract full indicator listing blocks using brace depth parsing (regex insufficient due to nested objects)
    const indicatorBlocks = [];
    const marker = 'new IndicatorListing';
    const listings = [];
    let order = 0;

    // Build list of raw indicator listing blocks
    let searchIndex = 0;
    while (true) {
      const start = cs.indexOf(marker, searchIndex);
      if (start === -1) break;
      const braceStart = cs.indexOf('{', start);
      if (braceStart === -1) break;
      let depth = 0; let i = braceStart; let inString = false; let stringChar = '';
      for (; i < cs.length; i++) {
        const ch = cs[i];
        const prev = cs[i - 1];
        if (inString) {
          if (ch === stringChar && prev !== '\\') inString = false;
        } else {
          if (ch === '"' || ch === "'") { inString = true; stringChar = ch; }
          else if (ch === '{') depth++;
          else if (ch === '}') {
            depth--;
            if (depth === 0) {
              let end = i + 1;
              if (cs[end] === ',') end++;
              indicatorBlocks.push(cs.slice(start, end));
              searchIndex = end;
              break;
            }
          }
        }
      }
      if (i >= cs.length) break; // safety
    }

    function extractEndpoint(block) {
      // Endpoint = $"{baseUrl}/ADX/" or similar
      const m = /Endpoint\s*=\s*\$"\{baseUrl}\/(.*?)\//.exec(block);
      return m ? `/${m[1]}/` : '';
    }

    function extractSection(block, key) {
      // Returns the raw content inside [...] for collections like Parameters, Results, Thresholds
      const idx = block.indexOf(key + ' =');
      if (idx === -1) return '';
      const startBracket = block.indexOf('[', idx);
      if (startBracket === -1) return '';
      let depth = 0;
      let i = startBracket;
      for (; i < block.length; i++) {
        const ch = block[i];
        if (ch === '[') depth++;
        else if (ch === ']') {
          depth--;
          if (depth === 0) {
            return block.slice(startBracket + 1, i); // inside brackets
          }
        }
      }
      return '';
    }

    function extractObjectLiterals(section) {
      // Extract all new() { ... } blocks
      const items = [];
      const marker = 'new()';
      let idx = 0;
      while (true) {
        const start = section.indexOf(marker, idx);
        if (start === -1) break;
        const braceStart = section.indexOf('{', start);
        if (braceStart === -1) break;
        let depth = 0; let i = braceStart;
        for (; i < section.length; i++) {
          const ch = section[i];
            if (ch === '{') depth++;
            else if (ch === '}') {
              depth--;
              if (depth === 0) {
                items.push(section.slice(braceStart + 1, i));
                idx = i + 1;
                break;
              }
            }
        }
        if (i >= section.length) break;
      }
      return items;
    }

    function parseFill(str) {
      const t = /Target\s*=\s*"([^"]+)"/.exec(str)?.[1];
      const ca = /ColorAbove\s*=\s*([A-Za-z0-9_.]+)/.exec(str)?.[1] || /ColorAbove\s*=\s*"([^"]+)"/.exec(str)?.[1];
      const cb = /ColorBelow\s*=\s*([A-Za-z0-9_.]+)/.exec(str)?.[1] || /ColorBelow\s*=\s*"([^"]+)"/.exec(str)?.[1];
      if (!t || !ca || !cb) return null;
      return { target: t, colorAbove: ca, colorBelow: cb };
    }

    function parseParameters(block) {
      const raw = extractSection(block, 'Parameters');
      if (!raw.trim()) return [];
      return extractObjectLiterals(raw).map(obj => {
        return {
          displayName: /DisplayName\s*=\s*"([^"]+)"/.exec(obj)?.[1] || '',
          paramName: /ParamName\s*=\s*"([^"]+)"/.exec(obj)?.[1] || '',
          dataType: /DataType\s*=\s*"([^"]+)"/.exec(obj)?.[1] || 'number',
          defaultValue: Number(/DefaultValue\s*=\s*([0-9.]+)/.exec(obj)?.[1] || 0),
          minimum: Number(/Minimum\s*=\s*([0-9.]+)/.exec(obj)?.[1] || 0),
          maximum: Number(/Maximum\s*=\s*([0-9.]+)/.exec(obj)?.[1] || 0)
        };
      });
    }

    function parseResults(block) {
      const raw = extractSection(block, 'Results');
      if (!raw.trim()) return [];
      const objs = extractObjectLiterals(raw);
      return objs.map((obj, idx) => {
        // Potential Fill subobject
        let fill = null;
        const fillIdx = obj.indexOf('Fill');
        if (fillIdx !== -1) {
          const fillNew = obj.indexOf('new()', fillIdx);
          if (fillNew !== -1) {
            const braceStart = obj.indexOf('{', fillNew);
            if (braceStart !== -1) {
              let depth = 0; let i = braceStart;
              for (; i < obj.length; i++) {
                const ch = obj[i];
                if (ch === '{') depth++;
                else if (ch === '}') { depth--; if (depth === 0) { fill = parseFill(obj.slice(braceStart + 1, i)); break; } }
              }
            }
          }
        }
        return {
          displayName: /DisplayName\s*=\s*"([^"]+)"/.exec(obj)?.[1] || '',
            tooltipTemplate: /TooltipTemplate\s*=\s*"([^"]+)"/.exec(obj)?.[1] || '',
            dataName: /DataName\s*=\s*"([^"]+)"/.exec(obj)?.[1] || '',
            dataType: /DataType\s*=\s*"([^"]+)"/.exec(obj)?.[1] || 'number',
            lineType: /LineType\s*=\s*"([^"]+)"/.exec(obj)?.[1] || 'solid',
            stack: /Stack\s*=\s*"([^"]+)"/.exec(obj)?.[1] || '',
            lineWidth: /LineWidth\s*=\s*([0-9.]+)/.exec(obj)?.[1] ? Number(/LineWidth\s*=\s*([0-9.]+)/.exec(obj)?.[1]) : null,
            defaultColor: /DefaultColor\s*=\s*([A-Za-z0-9_.]+)/.exec(obj)?.[1] || /DefaultColor\s*=\s*"([^"]+)"/.exec(obj)?.[1] || '',
            fill,
            order: idx
        };
      });
    }

    function parseChartConfig(block) {
      const idx = block.indexOf('ChartConfig');
      if (idx === -1) return null;
      const newIdx = block.indexOf('new ChartConfig', idx);
      if (newIdx === -1) return null;
      const braceStart = block.indexOf('{', newIdx);
      if (braceStart === -1) return null;
      let depth = 0; let i = braceStart;
      for (; i < block.length; i++) {
        const ch = block[i];
        if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (depth === 0) break; }
      }
      if (i >= block.length) return null;
      const cfgBody = block.slice(braceStart + 1, i);
      const minimumYAxis = /MinimumYAxis\s*=\s*([0-9.]+)/.exec(cfgBody)?.[1];
      const maximumYAxis = /MaximumYAxis\s*=\s*([0-9.]+)/.exec(cfgBody)?.[1];
      // Thresholds
      const thresholdsRaw = extractSection(cfgBody, 'Thresholds');
      const thresholds = thresholdsRaw ? extractObjectLiterals(thresholdsRaw).map(obj => {
        let fill = null;
        if (/Fill\s*=/.test(obj)) {
          // parse nested Fill
          const fillNew = obj.indexOf('new()', obj.indexOf('Fill'));
          if (fillNew !== -1) {
            const fBrace = obj.indexOf('{', fillNew);
            if (fBrace !== -1) {
              let d = 0; let j = fBrace;
              for (; j < obj.length; j++) {
                const ch2 = obj[j];
                if (ch2 === '{') d++;
                else if (ch2 === '}') { d--; if (d === 0) { fill = parseFill(obj.slice(fBrace + 1, j)); break; } }
              }
            }
          }
        }
        return {
          value: Number(/Value\s*=\s*([0-9.]+)/.exec(obj)?.[1] || 0),
          color: /Color\s*=\s*([A-Za-z0-9_.]+)/.exec(obj)?.[1] || /Color\s*=\s*"([^"]+)"/.exec(obj)?.[1] || '',
          style: /Style\s*=\s*"([^"]+)"/.exec(obj)?.[1] || '',
          fill
        };
      }) : [];
      return {
        minimumYAxis: minimumYAxis ? Number(minimumYAxis) : null,
        maximumYAxis: maximumYAxis ? Number(maximumYAxis) : null,
        thresholds
      };
    }

  for (const raw of indicatorBlocks) {
      if (!/Uiid\s*=/.test(raw) || !/Endpoint\s*=/.test(raw)) continue;
      const name = /\bName\s*=\s*"([^"]+)"/.exec(raw)?.[1];
      const uiid = /\bUiid\s*=\s*"([^"]+)"/.exec(raw)?.[1];
      const legendTemplate = /\bLegendTemplate\s*=\s*"([^"]+)"/.exec(raw)?.[1] || '';
      const endpoint = extractEndpoint(raw);
      const category = /\bCategory\s*=\s*"([^"]+)"/.exec(raw)?.[1] || 'unknown';
      const chartType = /\bChartType\s*=\s*"([^"]+)"/.exec(raw)?.[1] || 'overlay';
      if (name && uiid && endpoint) {
        const parameters = parseParameters(raw);
        const results = parseResults(raw);
        const chartConfig = parseChartConfig(raw);
        listings.push({
          name,
          uiid,
          legendTemplate,
          endpoint,
          category,
          chartType,
          order: order++,
          chartConfig: chartConfig || null,
          parameters,
          results
        });
      }
    }
    if (listings.length === 0) throw new Error('No listings parsed from metadata');
    return listings;
  } catch (err) {
    console.error('Fallback metadata parse failed:', err.message);
    return [];
  }
}

(async () => {
  let listings;
  try {
    listings = await fetchFromApi();
  } catch (err) {
    console.warn('Primary API fetch failed:', err.message);
    listings = fallbackParseMetadata();
      if (listings.length === 0 && fs.existsSync(backupJsonFile)) {
        console.log('Using existing JSON snapshot as fallback.');
        try { listings = JSON.parse(fs.readFileSync(backupJsonFile,'utf8')); } catch {}
      }
      if (listings.length === 0) {
        console.error('No data available from API, metadata parse, or JSON snapshot. Aborting.');
        process.exit(4);
      }
  }

  try {
    const ts = serializeTs(listings);
  fs.writeFileSync(backupJsonFile, JSON.stringify(listings, null, 2), 'utf8');
  fs.writeFileSync(outputPath, ts, { encoding: 'utf8', mode: 0o644, flag: 'w' });
    console.log(`✅ Generated backup indicators at: ${outputPath}`);
  } catch (e) {
    console.error('Write failed:', e.message);
    process.exit(5);
  }
})();
