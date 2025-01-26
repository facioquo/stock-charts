using System.Text.Json;
using Alpaca.Markets;
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Skender.Stock.Indicators;
using WebApi.Services;

namespace Functions;

public class Jobs
{
    private readonly ILogger _logger;
    private readonly IConfiguration _configuration;
    private readonly IStorage _storage;
    private readonly string? _keyVaultUrl;
    private readonly string? _alpacaKey;
    private readonly string? _alpacaSecret;

    public Jobs(
        ILoggerFactory loggerFactory,
        IConfiguration configuration,
        IStorage storage)
    {
        _logger = loggerFactory.CreateLogger<Jobs>();
        _configuration = configuration;
        _storage = storage;

        // Load configuration on startup
        (_alpacaKey, _alpacaSecret) = GetAlpacaCredentials();
        _keyVaultUrl = _configuration["KEY_VAULT_URL"];
    }

    /// <summary>
    ///   Schedule to get and cache quotes from source feed.
    /// </summary>
    /// <param name="myTimer" cref="TimerInfo">CRON-based schedule</param>
    /// <remarks>Depends on TZ environment settings for EST time zone</remarks>
    [Function("UpdateQuotes")]
    public async Task Run([TimerTrigger("0 */1 08-18 * * 1-5")] TimerInfo myTimer)
    {
        // ~ extended market hours, every minute "0 */1 08-18 * * 1-5"
        // for dev: minutely "0 */1 * * * *"
        List<Task> tasks = new() {
            StoreQuoteDaily("SPY"),
            StoreQuoteDaily("QQQ")
        };
        await Task.WhenAll(tasks);

        _logger.LogInformation(
            "Quotes updated on {date and time} for {schedule status}.",
             DateTime.Now, myTimer.ScheduleStatus);
    }

    private (string? key, string? secret) GetAlpacaCredentials()
    {
        string? key = _configuration["ALPACA_KEY"]
            ?? _configuration["UserSecrets:ALPACA_KEY"];

        string? secret = _configuration["ALPACA_SECRET"]
            ?? _configuration["UserSecrets:ALPACA_SECRET"];

        return (key, secret);
    }

    private async Task<(string key, string secret)> GetAlpacaCredentialsFromKeyVault()
    {
        if (string.IsNullOrEmpty(_keyVaultUrl))
        {
            throw new InvalidOperationException("Key Vault URL is not configured");
        }

        try
        {
            SecretClient secretClient = new(
                    new Uri(_keyVaultUrl),
                    new DefaultAzureCredential()
                );

            // Get both secrets in parallel
            Azure.Response<KeyVaultSecret>[] tasks = await Task.WhenAll(
                secretClient.GetSecretAsync("ALPACA_KEY"),
                secretClient.GetSecretAsync("ALPACA_SECRET")
            );

            return (tasks[0].Value.Value, tasks[1].Value.Value);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve credentials from Key Vault");
            throw new InvalidOperationException("Failed to retrieve credentials from Key Vault", ex);
        }
    }

    private async Task<(string key, string secret)> GetValidAlpacaCredentials()
    {
        // Try environment/configuration first
        if (!string.IsNullOrEmpty(_alpacaKey) && !string.IsNullOrEmpty(_alpacaSecret))
        {
            return (_alpacaKey, _alpacaSecret);
        }

        // Fall back to key vault
        try
        {
            return await GetAlpacaCredentialsFromKeyVault();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get valid Alpaca credentials");
            throw new InvalidOperationException(
                "Unable to retrieve Alpaca credentials from any source", ex);
        }
    }

    /// <summary>
    ///   STORE QUOTES: get and store historical quotes to blob storage provider.
    /// </summary>
    /// <param name="symbol">Security symbol</param>
    /// <exception cref="ArgumentNullException">
    ///   When credentials are missing
    /// </exception>
    private async Task StoreQuoteDaily(string symbol)
    {
        (string key, string secret) = await GetValidAlpacaCredentials();

        // fetch from Alpaca paper trading API
        IAlpacaDataClient alpacaDataClient = Environments.Paper
            .GetAlpacaDataClient(new SecretKey(key, secret));

        DateTime into = DateTime.Now.Subtract(TimeSpan.FromMinutes(16));
        DateTime from = into.Subtract(TimeSpan.FromDays(800));

        IPage<IBar> barSet = await alpacaDataClient.ListHistoricalBarsAsync(
            new HistoricalBarsRequest(symbol, from, into, BarTimeFrame.Day));

        List<Quote> quotes = new(barSet.Items.Count);

        // compose
        foreach (IBar bar in barSet.Items)
        {
            quotes.Add(new Quote {
                Date = bar.TimeUtc,
                Open = bar.Open,
                High = bar.High,
                Low = bar.Low,
                Close = bar.Close,
                Volume = bar.Volume
            });
        }

        string json = JsonSerializer
            .Serialize(quotes.OrderBy(x => x.Date));

        // store in Azure Blob Storage
        string blobName = $"{symbol}-DAILY.json";
        await _storage.PutBlobAsync(blobName, json);

        _logger.LogInformation("Updated {blobName name}.", blobName);
    }
}
