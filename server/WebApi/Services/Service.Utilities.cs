namespace WebApi.Services;

public static class Utilities
{
    /// <summary>
    /// Converts a PeriodSize to a TimeSpan.
    /// </summary>
    /// <param name="periodSize">The PeriodSize value.</param>
    /// <returns>The corresponding TimeSpan value.</returns>
    internal static TimeSpan ToTimeSpan(this PeriodSize periodSize)
    => periodSize switch {
        PeriodSize.OneMinute => TimeSpan.FromMinutes(1),
        PeriodSize.TwoMinutes => TimeSpan.FromMinutes(2),
        PeriodSize.ThreeMinutes => TimeSpan.FromMinutes(3),
        PeriodSize.FiveMinutes => TimeSpan.FromMinutes(5),
        PeriodSize.FifteenMinutes => TimeSpan.FromMinutes(15),
        PeriodSize.ThirtyMinutes => TimeSpan.FromMinutes(30),
        PeriodSize.OneHour => TimeSpan.FromHours(1),
        PeriodSize.TwoHours => TimeSpan.FromHours(2),
        PeriodSize.FourHours => TimeSpan.FromHours(4),
        PeriodSize.Day => TimeSpan.FromDays(1),
        PeriodSize.Week => TimeSpan.FromDays(7),
        // intentionally skipping Month; fail fast on unsupported values
        _ => throw new ArgumentOutOfRangeException(nameof(periodSize), periodSize, "Unsupported PeriodSize value. Add explicit mapping in ToTimeSpan().")
    };
}
