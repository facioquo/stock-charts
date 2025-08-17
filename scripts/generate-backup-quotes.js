#!/usr/bin/env node
/*
 * Generates a deterministic set of backup quotes (same logic as original TS) and writes to JSON.
 */
const fs = require('fs');
const path = require('path');

class SeededRandom {
  constructor(seed) { this.seed = seed; }
  next() { this.seed = (this.seed * 9301 + 49297) % 233280; return this.seed / 233280; }
}

function isMarketHoliday(date){
  const m = date.getMonth() + 1; const d = date.getDate();
  if ((m===1&&d===1)||(m===7&&d===4)||(m===12&&d===25)) return true;
  if (m===11 && d>=22 && d<=28 && date.getDay()===4) return true; // Thanksgiving
  if (m===3 && d===25 && date.getDay()===5) return true; // Simplified Good Friday
  return false;
}

function generateDailyQuote(date, previousClose, dayIndex, rnd){
  const trendFactor = 1 + dayIndex * 0.0003;
  const basePrice = previousClose * trendFactor;
  let volatilityFactor = 1.0;
  if (dayIndex % 120 === 0 && dayIndex > 0) volatilityFactor = 0.92; else if (dayIndex % 60 === 0 && dayIndex > 0) volatilityFactor = 1.05;
  const dailyVolatility = (rnd.next() - 0.5) * 0.04;
  const extraVolatility = rnd.next() < 0.1 ? (rnd.next() - 0.5) * 0.06 : 0;
  const open = basePrice * volatilityFactor * (1 + (rnd.next() - 0.5) * 0.01);
  const close = open * (1 + dailyVolatility + extraVolatility);
  const maxOC = Math.max(open, close); const minOC = Math.min(open, close);
  const high = maxOC * (1 + rnd.next() * 0.015);
  const low = minOC * (1 - rnd.next() * 0.015);
  const priceChangePercent = Math.abs((close - open) / open);
  const baseVolume = 50000000 + rnd.next() * 100000000;
  const volumeMultiplier = 1 + priceChangePercent * 2;
  const volume = Math.floor(baseVolume * volumeMultiplier);
  // Create date with hour and minute details for PeriodSize compatibility
  // Use market open time (9:30 AM) with some variation for intraday realism
  const marketOpenHour = 9;
  const marketOpenMinute = 30;
  const hourVariation = Math.floor(rnd.next() * 7); // 0-6 hours variation during trading day
  const minuteVariation = Math.floor(rnd.next() * 60); // 0-59 minutes variation
  
  const finalDate = new Date(date);
  finalDate.setHours(marketOpenHour + hourVariation, marketOpenMinute + minuteVariation, 0, 0);
  
  return {
    date: finalDate.toISOString().slice(0, 16), // YYYY-MM-DDTHH:MM format (no timezone)
    open: +(open.toFixed(2)),
    high: +(high.toFixed(2)),
    low: +(low.toFixed(2)),
    close: +(close.toFixed(2)),
    volume
  };
}

function generateBackupQuotes(seed=12345){
  const rnd = new SeededRandom(seed);
  const quotes = [];
  const startDate = new Date('2016-01-04');
  let currentPrice = 200.0;
  for (let dayOffset = 0; quotes.length < 1000; dayOffset++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + dayOffset);
    if (currentDate.getDay()===0 || currentDate.getDay()===6) continue;
    if (isMarketHoliday(currentDate)) continue;
    const q = generateDailyQuote(currentDate, currentPrice, quotes.length, rnd);
    quotes.push(q);
    currentPrice = q.close;
  }
  quotes.sort((a,b)=> new Date(a.date) - new Date(b.date));
  return quotes;
}

function main(){
  const data = generateBackupQuotes();
  const outPath = path.join(__dirname, '..', 'client', 'src', 'app', 'data', 'backup-quotes.json');
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2)+"\n");
  console.log(`Wrote ${data.length} backup quotes to ${outPath}`);
}

if (require.main === module) main();
