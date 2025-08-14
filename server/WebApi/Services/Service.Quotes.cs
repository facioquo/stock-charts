using System.Text.Json;

namespace WebApi.Services;

public interface IQuoteService
{
    Task<IEnumerable<Quote>> Get();
    Task<IEnumerable<Quote>> Get(string symbol);
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
    public async Task<IEnumerable<Quote>> Get()
        => await Get("QQQ");

    /// <summary>
    /// Get quotes for a specific symbol.
    /// </summary>
    /// <param name="symbol">"SPY" or "QQQ" only, for now</param>
    public async Task<IEnumerable<Quote>> Get(string symbol)
    {
        string blobName = $"{symbol}-DAILY.json";

        try
        {
            BlobClient blob = _storage.GetBlobClient(blobName);

            if (!await blob.ExistsAsync())
            {
                _logger.LogWarning("Blob {BlobName} not found, using backup data", blobName);
                return backupQuotes;
            }

            Response<BlobDownloadInfo> response = await blob.DownloadAsync();
            using Stream? stream = response?.Value.Content;

            if (stream == null)
            {
                _logger.LogError("Download stream was null for {BlobName}", blobName);
                return backupQuotes;
            }

            List<Quote>? quotes = await JsonSerializer.DeserializeAsync<List<Quote>>(stream);

            if (quotes == null || quotes.Count == 0)
            {
                _logger.LogWarning("No quotes found in {BlobName}", blobName);
                return backupQuotes;
            }

            return quotes.OrderBy(x => x.Date);
        }

        // failover to backup quotes for local development and testing
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve quotes for {Symbol}", symbol);
            return backupQuotes;
        }
    }
}
