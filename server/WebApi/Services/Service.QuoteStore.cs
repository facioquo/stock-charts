using System.Net;

namespace WebApi.Services;

/// <summary>
/// Read-only access to the stored quote datasets that the scheduled quote
/// refresh writes.
/// </summary>
public interface IQuoteStore
{
    /// <summary>
    /// Opens the stored daily quote dataset for a symbol.
    /// </summary>
    /// <param name="symbol">Security symbol, e.g. "QQQ".</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>
    /// A seekable stream over the stored JSON, or <c>null</c> when no dataset
    /// has been published yet. Callers own the returned stream.
    /// </returns>
    Task<Stream?> OpenQuotesAsync(string symbol, CancellationToken ct);
}

/// <summary>
/// Fetches quote datasets over HTTP. In production the configured base address
/// resolves to an R2 bucket exposed to the container by the edge Worker's
/// outbound handler, so no storage credentials ever enter the container.
/// </summary>
public sealed partial class HttpQuoteStore(
    IHttpClientFactory httpClientFactory,
    ILogger<HttpQuoteStore> logger) : IQuoteStore
{
    /// <summary>Named <see cref="HttpClient"/> registered in startup configuration.</summary>
    public const string HttpClientName = "quotes";

    private readonly IHttpClientFactory _httpClientFactory = httpClientFactory;
    private readonly ILogger<HttpQuoteStore> _logger = logger;

    public async Task<Stream?> OpenQuotesAsync(string symbol, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(symbol);

        string objectName = $"{symbol}-DAILY.json";
        HttpClient client = _httpClientFactory.CreateClient(HttpClientName);

        using HttpResponseMessage response
            = await client.GetAsync(objectName, HttpCompletionOption.ResponseHeadersRead, ct);

        if (response.StatusCode is HttpStatusCode.NotFound)
        {
            LogQuotesNotFound(objectName);
            return null;
        }

        response.EnsureSuccessStatusCode();

        // Buffer before the response (and its network stream) is disposed. The
        // daily datasets are a few hundred KB, so this stays cheap and lets the
        // caller own a plain seekable stream.
        MemoryStream buffer = new();
        await response.Content.CopyToAsync(buffer, ct);
        buffer.Position = 0;
        return buffer;
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "Quote dataset {ObjectName} not found, using backup data")]
    private partial void LogQuotesNotFound(string objectName);
}
