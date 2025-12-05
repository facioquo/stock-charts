import { Quote } from "../pages/chart/chart.models";

/**
 * Simple seeded random number generator for deterministic quote generation
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    // Linear congruential generator
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

/**
 * Round a number to a target number of significant digits while avoiding
 * scientific notation for values in a typical stock price range.
 * For prices we keep 2 decimal places after applying sig rounding to 6 sig figs.
 */
function roundPrice(value: number, sig: number = 6): number {
  if (!isFinite(value) || value === 0) return 0;
  const digits = Math.floor(Math.log10(Math.abs(value)));
  const scale = Math.pow(10, sig - digits - 1);
  const rounded = Math.round(value * scale) / scale;
  // Keep typical two decimals (cents) after sig rounding for realism
  return Math.round(rounded * 100) / 100;
}

/**
 * Generate realistic backup quotes for QQQ (Invesco QQQ Trust)
 * Creates exactly 1000 business days of historical data from 2016-2019
 */
function generateBackupQuotes(seed: number = 12345): Quote[] {
  const random = new SeededRandom(seed);
  const quotes: Quote[] = [];
  // Use UTC date construction to avoid local timezone / DST variation.
  // 2016-01-04 was a Monday.
  const startUtc = Date.UTC(2016, 0, 4); // months 0-based
  let dayCursor = 0;
  const initialPrice = 200.0; // Starting price baseline for QQQ in early 2016
  let currentPrice = initialPrice;

  while (quotes.length < 1000) {
    const currentDate = new Date(startUtc + dayCursor * 24 * 60 * 60 * 1000);

    // Skip weekends using UTC to remain deterministic across environments
    const dayOfWeek = currentDate.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      dayCursor++;
      continue;
    }

    // Skip major holidays (UTC evaluation)
    if (isMarketHolidayUTC(currentDate)) {
      dayCursor++;
      continue;
    }

    const quote = generateDailyQuoteUTC(currentDate, currentPrice, quotes.length, random);
    quotes.push(quote);
    currentPrice = quote.close;
    dayCursor++;
  }

  return quotes; // Already chronological by construction
}

/**
 * Client-side backup quotes for use when the backend API is completely unavailable.
 * This provides a fallback dataset with realistic stock data to ensure the application
 * can still render charts and demonstrate functionality during development or API outages.
 *
 * Data represents QQQ (Invesco QQQ Trust) daily prices with realistic OHLCV data.
 * Dataset contains exactly 1000 data points covering 2016-2019.
 */
export const CLIENT_BACKUP_QUOTES: Quote[] = generateBackupQuotes();

/**
 * Generate a single day's quote with realistic OHLCV data
 */
function generateDailyQuoteUTC(
  utcDate: Date,
  previousClose: number,
  dayIndex: number,
  random: SeededRandom
): Quote {
  // Previous version compounded a multiplicative trend causing unrealistic
  // astronomical values (leading to scientific notation in JSON). Instead,
  // create a gentle linear drift and apply it relative to the initial price.
  const linearDrift = 0.0005 * dayIndex; // ~0.05% per trading day
  // Anchor drift to initial price rather than compounding previousClose
  const basePrice = initialAnchorPrice(previousClose, linearDrift);

  let volatilityFactor = 1.0;
  if (dayIndex % 120 === 0 && dayIndex > 0)
    volatilityFactor = 0.92; // correction
  else if (dayIndex % 60 === 0 && dayIndex > 0) volatilityFactor = 1.05; // rally

  const dailyVolatility = (random.next() - 0.5) * 0.04;
  const extraVolatility = random.next() < 0.1 ? (random.next() - 0.5) * 0.06 : 0;
  const open = basePrice * volatilityFactor * (1 + (random.next() - 0.5) * 0.01);
  const close = open * (1 + dailyVolatility + extraVolatility);
  const maxOC = Math.max(open, close);
  const minOC = Math.min(open, close);
  const high = maxOC * (1 + random.next() * 0.015);
  const low = minOC * (1 - random.next() * 0.015);

  const priceChangePercent = Math.abs((close - open) / open);
  const baseVolume = 50000000 + random.next() * 100000000;
  const volumeMultiplier = 1 + priceChangePercent * 2;
  const volume = Math.floor(baseVolume * volumeMultiplier);

  // Use midnight (00:00) to clearly represent daily PeriodSize without intraday noise
  const finalDate = new Date(
    Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(), 0, 0, 0, 0)
  );

  return {
    date: finalDate,
    open: clampPrice(roundPrice(open)),
    high: clampPrice(roundPrice(high)),
    low: clampPrice(roundPrice(low)),
    close: clampPrice(roundPrice(close)),
    volume
  };
}

// Maintain prices within a realistic band; prevents outliers from volatility math
function clampPrice(value: number, min = 50, max = 500): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

// Compute base price anchored to initial price * (1 + drift) not compounding uncontrolled
function initialAnchorPrice(previousClose: number, drift: number): number {
  // We deliberately de-emphasize previousClose to avoid runaway; weighted blend
  // 70% yesterday close, 30% initial baseline * drift
  const initialBaseline = 200 * (1 + drift);
  return 0.7 * previousClose + 0.3 * initialBaseline;
}

/**
 * Check if a given date is a major market holiday
 */
function isMarketHolidayUTC(date: Date): boolean {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const weekday = date.getUTCDay();
  if (month === 1 && day === 1) return true; // New Year
  if (month === 7 && day === 4) return true; // Independence Day
  if (month === 12 && day === 25) return true; // Christmas
  if (month === 11 && day >= 22 && day <= 28 && weekday === 4) return true; // Thanksgiving
  if (month === 3 && day === 25 && weekday === 5) return true; // Good Friday (fixed deterministic)
  return false;
}

/**
 * Get the client backup quotes count
 */
export function getClientBackupQuotesCount(): number {
  return CLIENT_BACKUP_QUOTES.length;
}

/**
 * Get a subset of client backup quotes (for testing purposes)
 */
export function getClientBackupQuotesSubset(count: number): Quote[] {
  return CLIENT_BACKUP_QUOTES.slice(-count);
}
