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
 * Generate realistic backup quotes for QQQ (Invesco QQQ Trust)
 * Creates exactly 1000 business days of historical data from 2016-2019
 */
function generateBackupQuotes(seed: number = 12345): Quote[] {
  const random = new SeededRandom(seed);
  const quotes: Quote[] = [];
  const startDate = new Date("2016-01-04"); // Start on a Monday
  let currentPrice = 200.0; // Starting price for QQQ in early 2016

  // Generate exactly 1000 business days
  for (let dayOffset = 0; quotes.length < 1000; dayOffset++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + dayOffset);

    // Skip weekends (realistic stock market data)
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      continue;
    }

    // Skip major holidays
    if (isMarketHoliday(currentDate)) {
      continue;
    }

    // Generate realistic daily price movement
    const quote = generateDailyQuote(currentDate, currentPrice, quotes.length, random);
    quotes.push(quote);

    // Update current price for next iteration
    currentPrice = quote.close;
  }

  return quotes.sort((a, b) => a.date.getTime() - b.date.getTime());
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
function generateDailyQuote(
  date: Date,
  previousClose: number,
  dayIndex: number,
  random: SeededRandom
): Quote {
  // Create upward trend over time with periodic corrections
  const trendFactor = 1 + dayIndex * 0.0003; // Gradual upward trend
  const basePrice = previousClose * trendFactor;

  // Add market volatility and corrections
  let volatilityFactor = 1.0;

  // Add periodic corrections for realism
  if (dayIndex % 120 === 0 && dayIndex > 0) {
    volatilityFactor = 0.92; // ~8% correction every ~6 months
  } else if (dayIndex % 60 === 0 && dayIndex > 0) {
    volatilityFactor = 1.05; // 5% rally every ~3 months
  }

  // Generate daily price range
  const dailyVolatility = (random.next() - 0.5) * 0.04; // ±2% typical daily range
  const extraVolatility = random.next() < 0.1 ? (random.next() - 0.5) * 0.06 : 0; // 10% chance of ±3% extra volatility

  const open = basePrice * volatilityFactor * (1 + (random.next() - 0.5) * 0.01);
  const close = open * (1 + dailyVolatility + extraVolatility);

  // High and low with realistic spreads
  const maxOC = Math.max(open, close);
  const minOC = Math.min(open, close);
  const high = maxOC * (1 + random.next() * 0.015); // Up to 1.5% above max of O/C
  const low = minOC * (1 - random.next() * 0.015); // Up to 1.5% below min of O/C

  // Realistic volume based on price movement
  const priceChangePercent = Math.abs((close - open) / open);
  const baseVolume = 50000000 + random.next() * 100000000; // 50M-150M base
  const volumeMultiplier = 1 + priceChangePercent * 2; // Higher volume on big moves
  const volume = Math.floor(baseVolume * volumeMultiplier);

  return {
    date: new Date(date),
    open: Math.round(open * 100) / 100,
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    close: Math.round(close * 100) / 100,
    volume: volume
  };
}

/**
 * Check if a given date is a major market holiday
 */
function isMarketHoliday(date: Date): boolean {
  const month = date.getMonth() + 1; // getMonth() is 0-based
  const day = date.getDate();

  // New Year's Day
  if (month === 1 && day === 1) return true;

  // Independence Day
  if (month === 7 && day === 4) return true;

  // Christmas Day
  if (month === 12 && day === 25) return true;

  // Thanksgiving (4th Thursday in November) - simplified check
  if (month === 11 && day >= 22 && day <= 28 && date.getDay() === 4) return true;

  // Good Friday (varies, but typically in March/April) - simplified deterministic check
  if (month === 3 && day === 25 && date.getDay() === 5) return true; // Fixed date for deterministic behavior

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
