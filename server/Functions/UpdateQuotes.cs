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

public class Jobs(ILoggerFactory loggerFactory, IConfiguration configuration)
{
    private readonly ILogger _logger = loggerFactory.CreateLogger<Jobs>();
    private readonly IConfiguration _configuration = configuration;

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
        await StoreQuoteDaily("SPY");
        await StoreQuoteDaily("QQQ");

        _logger.LogInformation(
            "Quotes updated on {date and time} for {schedule status}.",
             DateTime.Now, myTimer.ScheduleStatus);
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
        // get and validate keys, see README.md
        string? alpacaKey = _configuration["ALPACA_KEY"];
        string? alpacaSecret = _configuration["ALPACA_SECRET"];

        if (string.IsNullOrEmpty(alpacaKey) || string.IsNullOrEmpty(alpacaSecret))
        {
            // Try to get from User Secrets
            alpacaKey = _configuration["UserSecrets:ALPACA_KEY"];
            alpacaSecret = _configuration["UserSecrets:ALPACA_SECRET"];
        }

        if (string.IsNullOrEmpty(alpacaKey) || string.IsNullOrEmpty(alpacaSecret))
        {
            // Try to get from Azure Key Vault
            string? keyVaultUrl = _configuration["KEY_VAULT_URL"];

            if (string.IsNullOrEmpty(keyVaultUrl))
            {
                throw new ArgumentNullException(
                    keyVaultUrl,
                    $"Key Vault URL missing, use `setx KEY_VAULT_URL \"MY-KEY-VAULT-URL\"` to set.");
            }

            SecretClient secretClient = new(new Uri(keyVaultUrl), new DefaultAzureCredential());

            KeyVaultSecret alpacaKeySecret = await secretClient.GetSecretAsync("ALPACA_KEY");
            KeyVaultSecret alpacaSecretSecret = await secretClient.GetSecretAsync("ALPACA_SECRET");

            alpacaKey = alpacaKeySecret.Value;
            alpacaSecret = alpacaSecretSecret.Value;
        }

        if (string.IsNullOrEmpty(alpacaKey))
        {
            throw new ArgumentNullException(
                alpacaKey,
                $"API KEY missing, use `setx ALPACA_KEY \"MY-ALPACA-KEY\"` to set.");
        }

        if (string.IsNullOrEmpty(alpacaSecret))
        {
            throw new ArgumentNullException(
                alpacaSecret,
                $"API SECRET missing, use `setx ALPACA_SECRET \"MY-ALPACA-SECRET\"` to set.");
        }

        // fetch from Alpaca paper trading API
        IAlpacaDataClient alpacaDataClient = Environments.Paper
            .GetAlpacaDataClient(new SecretKey(alpacaKey, alpacaSecret));

        DateTime into = DateTime.Now.Subtract(TimeSpan.FromMinutes(16));
        DateTime from = into.Subtract(TimeSpan.FromDays(800));

        IPage<IBar> barSet = await alpacaDataClient.ListHistoricalBarsAsync(
            new HistoricalBarsRequest(symbol, from, into, BarTimeFrame.Day));

        List<Quote> quotes = new(barSet.Items.Count);

        // compose
        foreach (IBar bar in barSet.Items)
        {
            Quote q = new() {
                Date = bar.TimeUtc,
                Open = bar.Open,
                High = bar.High,
                Low = bar.Low,
                Close = bar.Close,
                Volume = bar.Volume
            };
            quotes.Add(q);
        }

        string json = JsonSerializer.Serialize(quotes.OrderBy(x => x.Date));

        // store in Azure Blob Storage
        string blobName = $"{symbol}-DAILY.json";
        await Storage.PutBlob(blobName, json);

        _logger.LogInformation("Updated {blobName name}.", blobName);
    }
}
