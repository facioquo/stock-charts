using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace WebApi.Services;

public interface IQuoteService
{
    Task<IEnumerable<Bar>> Get(CancellationToken ct);
    Task<IEnumerable<Bar>> Get(string symbol, CancellationToken ct);
}

public partial class QuoteService(
    ILogger<QuoteService> logger,
    IQuoteStore store,
    IMemoryCache cache,
    IOptions<CacheSettings> cacheSettings) : IQuoteService
{
    private readonly ILogger<QuoteService> _logger = logger;
    private readonly IQuoteStore _store = store;
    private readonly IMemoryCache _cache = cache;
    private readonly TimeSpan _cacheDuration = cacheSettings.Value.Duration;

    /// <summary>
    /// Get default quotes
    /// </summary>
    /// <returns cref="Bar">List of default quotes</returns>
    public async Task<IEnumerable<Bar>> Get(CancellationToken ct)
        => await Get("QQQ", ct);

    /// <summary>
    /// Get quotes for a specific symbol, served from an in-memory cache so the
    /// shared quote blob is downloaded at most once per symbol per cache window
    /// regardless of how many indicator endpoints request it.
    /// </summary>
    /// <param name="symbol">"SPY" or "QQQ" only, for now</param>
    /// <param name="ct">Cancellation token</param>
    public async Task<IEnumerable<Bar>> Get(string symbol, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(symbol);

        symbol = symbol.Trim().ToUpperInvariant();
        if (symbol is not "SPY" and not "QQQ")
        {
            throw new ArgumentException("symbol must be \"SPY\" or \"QQQ\".", nameof(symbol));
        }

        string cacheKey = $"quotes:{symbol}";

        if (_cache.TryGetValue(cacheKey, out IReadOnlyList<Bar>? cached) && cached is not null)
        {
            return cached;
        }

        // A cancellation here propagates without caching; any other failure
        // falls back to backup quotes, which are cached like a real result so a
        // transient storage outage does not stampede the blob on every request.
        IReadOnlyList<Bar> quotes = await LoadQuotesAsync(symbol, ct);
        _cache.Set(cacheKey, quotes, _cacheDuration);
        return quotes;
    }

    private async Task<IReadOnlyList<Bar>> LoadQuotesAsync(string symbol, CancellationToken ct)
    {
        try
        {
            return await TryGetStoredQuotesAsync(symbol, ct) ?? QuoteBackup.BackupQuotes;
        }

        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }

        // failover to backup quotes for local development and testing
        catch (Exception ex)
        {
            LogRetrieveQuotesFailed(ex, symbol);
            return QuoteBackup.BackupQuotes;
        }
    }

    private async Task<IReadOnlyList<Bar>?> TryGetStoredQuotesAsync(string symbol, CancellationToken ct)
    {
        await using Stream? stream = await _store.OpenQuotesAsync(symbol, ct);

        if (stream is null)
        {
            return null;
        }

        List<Bar>? quotes = await JsonSerializer.DeserializeAsync<List<Bar>>(stream, cancellationToken: ct);

        if (quotes is null || quotes.Count == 0)
        {
            LogNoQuotesFound(symbol);
            return null;
        }

        return quotes.OrderBy(x => x.Timestamp).ToList();
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "No quotes found in stored dataset for {Symbol}")]
    private partial void LogNoQuotesFound(string symbol);

    [LoggerMessage(Level = LogLevel.Error, Message = "Failed to retrieve quotes for {Symbol}")]
    private partial void LogRetrieveQuotesFailed(Exception exception, string symbol);
}
