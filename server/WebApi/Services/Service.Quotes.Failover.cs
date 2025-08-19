namespace WebApi.Services;

// Deterministic synthetic backup quotes (1000 trading days) used if the shared JSON file is missing.
// Generated algorithmically (mirrors the prior Node implementation that produced the static JSON)
// so we avoid embedding a giant literal dataset twice. Node generator scripts have been removed.
internal static class QuoteBackup
{
    internal static readonly IReadOnlyList<Quote> BackupQuotes = Generate();

    private static IReadOnlyList<Quote> Generate()
    {
        const int target = 1000;
        const int seed = 12345;
        var rng = new SeededRandom(seed);
        var list = new List<Quote>(target);
        var startDate = new DateTime(2016, 1, 4, 0, 0, 0, DateTimeKind.Utc); // Monday
        decimal initialPrice = 200m;
        decimal previousClose = initialPrice;
        for (int dayOffset = 0; list.Count < target; dayOffset++)
        {
            var current = startDate.AddDays(dayOffset);
            if (current.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday) continue;
            if (IsHoliday(current)) continue;

            int dayIndex = list.Count;
            decimal linearDrift = 0.0005m * dayIndex;
            decimal baseline = initialPrice * (1 + linearDrift);
            decimal basePrice = 0.7m * previousClose + 0.3m * baseline;
            decimal volatilityFactor = 1.0m;
            if (dayIndex > 0 && dayIndex % 120 == 0) volatilityFactor = 0.92m;
            else if (dayIndex > 0 && dayIndex % 60 == 0) volatilityFactor = 1.05m;

            decimal Next() => (decimal)rng.Next(); // [0,1)
            decimal open = basePrice * volatilityFactor * (1 + (Next() - 0.5m) * 0.01m);
            decimal dailyVolatility = (Next() - 0.5m) * 0.04m;
            decimal extraVolatility = Next() < 0.1m ? (Next() - 0.5m) * 0.06m : 0m;
            decimal close = open * (1 + dailyVolatility + extraVolatility);
            decimal maxOC = decimal.Max(open, close);
            decimal minOC = decimal.Min(open, close);
            decimal high = maxOC * (1 + Next() * 0.015m);
            decimal low = minOC * (1 - Next() * 0.015m);

            decimal Clamp(decimal v) => v < 50m ? 50m : (v > 500m ? 500m : v);
            decimal Round(decimal v) => Math.Round(v, 2, MidpointRounding.AwayFromZero);

            decimal changePct = Math.Abs((close - open) / open);
            var baseVolume = 50_000_000m + Next() * 100_000_000m;
            var volumeMultiplier = 1 + changePct * 2;
            int volume = (int)Math.Floor(baseVolume * volumeMultiplier);

            var q = new Quote {
                Date = current,
                Open = Clamp(Round(open)),
                High = Clamp(Round(high)),
                Low = Clamp(Round(low)),
                Close = Clamp(Round(close)),
                Volume = volume
            };
            list.Add(q);
            previousClose = q.Close;
        }
        return list.ToList();
    }

    private static bool IsHoliday(DateTime d)
    {
        if ((d.Month == 1 && d.Day == 1) || (d.Month == 7 && d.Day == 4) || (d.Month == 12 && d.Day == 25)) return true;
        if (d.Month == 11 && d.Day >= 22 && d.Day <= 28 && d.DayOfWeek == DayOfWeek.Thursday) return true; // Thanksgiving
        if (d.Month == 3 && d.Day == 25 && d.DayOfWeek == DayOfWeek.Friday) return true; // simplified Good Friday
        return false;
    }

    private sealed class SeededRandom
    {
        private int _seed;
        public SeededRandom(int seed) { _seed = seed; }
        public double Next()
        {
            _seed = (_seed * 9301 + 49297) % 233280; // linear congruential
            return (double)_seed / 233280.0;
        }
    }
}

