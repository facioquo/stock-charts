using System.Text.Json;

namespace WebApi.Services;

public interface IQuoteService
{
    Task<IEnumerable<Quote>> Get(CancellationToken ct);
    Task<IEnumerable<Quote>> Get(string symbol, CancellationToken ct);
}

public partial class QuoteService(
    ILogger<QuoteService> logger,
    IStorage storage) : IQuoteService
{
    private readonly ILogger<QuoteService> _logger = logger;
    private readonly IStorage _storage = storage;

    /// <summary>
    /// Get default quotes
    /// </summary>
    /// <returns cref="Quote">List of default quotes</returns>
    public async Task<IEnumerable<Quote>> Get(CancellationToken ct)
        => await Get("QQQ", ct);

    /// <summary>
    /// Get quotes for a specific symbol.
    /// </summary>
    /// <param name="symbol">"SPY" or "QQQ" only, for now</param>
    /// <param name="ct">Cancellation token</param>
    public async Task<IEnumerable<Quote>> Get(string symbol, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(symbol);

        symbol = symbol.Trim().ToUpperInvariant();
        if (symbol is not "SPY" and not "QQQ")
        {
            throw new ArgumentException("symbol must be \"SPY\" or \"QQQ\".", nameof(symbol));
        }

        string blobName = $"{symbol}-DAILY.json";
        try
        {
            return await TryGetBlobQuotesAsync(blobName, ct) ?? QuoteBackup.BackupQuotes;
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

    private async Task<IEnumerable<Quote>?> TryGetBlobQuotesAsync(string blobName, CancellationToken ct)
    {
        BlobClient blob = _storage.GetBlobClient(blobName);

        if (!await blob.ExistsAsync(ct))
        {
            LogBlobNotFound(blobName);
            return null;
        }

        Response<BlobDownloadInfo> response = await blob.DownloadAsync(ct);
        await using Stream? stream = response?.Value.Content;

        if (stream == null)
        {
            LogDownloadStreamNull(blobName);
            return null;
        }

        List<Quote>? quotes = await JsonSerializer.DeserializeAsync<List<Quote>>(stream, cancellationToken: ct);

        if (quotes == null || quotes.Count == 0)
        {
            LogNoQuotesFound(blobName);
            return null;
        }

        return quotes.OrderBy(x => x.Timestamp);
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "Blob {BlobName} not found, using backup data")]
    private partial void LogBlobNotFound(string blobName);

    [LoggerMessage(Level = LogLevel.Error, Message = "Download stream was null for {BlobName}")]
    private partial void LogDownloadStreamNull(string blobName);

    [LoggerMessage(Level = LogLevel.Warning, Message = "No quotes found in {BlobName}")]
    private partial void LogNoQuotesFound(string blobName);

    [LoggerMessage(Level = LogLevel.Error, Message = "Failed to retrieve quotes for {Symbol}")]
    private partial void LogRetrieveQuotesFailed(Exception exception, string symbol);
}
