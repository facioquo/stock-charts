namespace WebApi.Services;

/// <summary>
/// API-level configuration bound from the "Api" configuration section.
/// </summary>
public sealed class ApiSettings
{
    /// <summary>Configuration section name.</summary>
    public static readonly string SectionName = "Api";

    /// <summary>
    /// Public origin (scheme + host) the API is reachable at, e.g.
    /// <c>https://stock-charts-api.example.workers.dev</c>.
    /// </summary>
    /// <remarks>
    /// The indicator catalog embeds absolute endpoint URLs. Behind the edge
    /// Worker the container only ever sees its own internal
    /// <c>http://localhost:8080</c> address, so the public origin cannot be
    /// derived from the request. When unset (local development, direct hosting)
    /// the request-derived origin is used instead.
    /// </remarks>
    public string? PublicBaseUrl { get; set; }
}
