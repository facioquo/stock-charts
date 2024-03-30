using System.Text.Json;
using Alpaca.Markets;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using Skender.Stock.Indicators;
using WebApi.Services;

namespace Functions;

public class Jobs(ILoggerFactory loggerFactory)
{
    private readonly ILogger _logger = loggerFactory.CreateLogger<Jobs>();

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

    // STORE QUOTE
    private async Task StoreQuoteDaily(string symbol)
    {
        // get and validate keys, see README.md
        string? ALPACA_KEY = Environment.GetEnvironmentVariable("ALPACA_KEY");
        string? ALPACA_SECRET = Environment.GetEnvironmentVariable("ALPACA_SECRET");

        if (string.IsNullOrEmpty(ALPACA_KEY))
        {
            throw new ArgumentNullException(
                ALPACA_KEY,
                $"API KEY missing, use `setx ALPACA_KEY \"MY-ALPACA-KEY\"` to set.");
        }

        if (string.IsNullOrEmpty(ALPACA_SECRET))
        {
            throw new ArgumentNullException(
                ALPACA_SECRET,
                $"API SECRET missing, use `setx AlpacaApiSecret \"MY-ALPACA-SECRET\"` to set.");
        }

        // fetch from Alpaca paper trading API
        IAlpacaDataClient alpacaDataClient = Environments.Paper
            .GetAlpacaDataClient(new SecretKey(ALPACA_KEY, ALPACA_SECRET));

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

        // store in Azure Blog
        string blobName = $"{symbol}-DAILY.json";
        await Storage.PutBlob(blobName, json);

        _logger.LogInformation("Updated {blobName name}.", blobName);
    }
}
