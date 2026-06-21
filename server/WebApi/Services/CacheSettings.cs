namespace WebApi.Services;

/// <summary>
/// Caching configuration shared by the server-side output cache, the in-memory
/// quote cache, and the client/CDN cache-control headers. Bound from the
/// "Caching" configuration section. Defaults are safe for daily-quote data:
/// the underlying quotes refresh at most once per trading day, so cached
/// indicator results stay correct well within the configured window.
/// </summary>
public sealed class CacheSettings
{
    /// <summary>Configuration section name.</summary>
    public static readonly string SectionName = "Caching";

    /// <summary>
    /// Lifetime, in minutes, applied to cached indicator responses, the
    /// in-memory quote cache, and the client/CDN <c>max-age</c> directive.
    /// </summary>
    public int DurationMinutes { get; set; } = 60;

    /// <summary>
    /// <see cref="DurationMinutes"/> as a <see cref="TimeSpan"/>, clamped to a
    /// minimum of one minute so a misconfigured (zero or negative) value can
    /// never disable caching outright.
    /// </summary>
    public TimeSpan Duration => TimeSpan.FromMinutes(Math.Max(1, DurationMinutes));
}

/// <summary>
/// Named <see cref="Microsoft.AspNetCore.OutputCaching.OutputCacheAttribute"/>
/// policies registered in startup configuration.
/// </summary>
public static class OutputCachePolicies
{
    /// <summary>
    /// Server-side cache policy for computed indicator responses. Varies by
    /// query string (each parameter set is a distinct entry) and by
    /// <c>Origin</c> for CORS correctness.
    /// </summary>
    public static readonly string IndicatorData = "IndicatorData";
}
