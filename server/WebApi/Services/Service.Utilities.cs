namespace WebApi.Services;

public static class Utilities
{
    /// <summary>
    /// Converts a BarInterval to a TimeSpan.
    /// </summary>
    /// <param name="periodSize">The BarInterval value.</param>
    /// <returns>The corresponding TimeSpan value.</returns>
    internal static TimeSpan ToTimeSpan(this BarInterval periodSize)
    => periodSize switch {
        BarInterval.OneMinute => TimeSpan.FromMinutes(1),
        BarInterval.TwoMinutes => TimeSpan.FromMinutes(2),
        BarInterval.ThreeMinutes => TimeSpan.FromMinutes(3),
        BarInterval.FiveMinutes => TimeSpan.FromMinutes(5),
        BarInterval.FifteenMinutes => TimeSpan.FromMinutes(15),
        BarInterval.ThirtyMinutes => TimeSpan.FromMinutes(30),
        BarInterval.OneHour => TimeSpan.FromHours(1),
        BarInterval.TwoHours => TimeSpan.FromHours(2),
        BarInterval.FourHours => TimeSpan.FromHours(4),
        BarInterval.Day => TimeSpan.FromDays(1),
        BarInterval.Week => TimeSpan.FromDays(7),
        // intentionally skipping Month; fail fast on unsupported values
        _ => throw new ArgumentOutOfRangeException(nameof(periodSize), periodSize, "Unsupported BarInterval value. Add explicit mapping in ToTimeSpan().")
    };
}
