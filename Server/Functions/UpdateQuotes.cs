using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Alpaca.Markets;
using Microsoft.Azure.WebJobs;
using Microsoft.Extensions.Logging;
using Skender.Stock.Indicators;
using WebApi.Services;

namespace Functions;

public class Jobs
{
    [FunctionName("UpdateQuotes")]
    public static async Task Run([TimerTrigger("0 */1 08-18 * * 1-5")] TimerInfo myTimer, ILogger log)
    {
        // ~ extended market hours, every minute "0 */1 08-18 * * 1-5"
        // for dev: minutely "0 */1 * * * *"
        await StoreQuoteDaily("SPY", log);
        await StoreQuoteDaily("QQQ", log);

        log.LogInformation($"Quotes updated at: {DateTime.Now}, {myTimer.ScheduleStatus}");
    }

    // STORE QUOTE
    private static async Task StoreQuoteDaily(string symbol, ILogger log)
    {
        string alpacaApiKey = Environment.GetEnvironmentVariable("AlpacaApiKey");
        string alpacaSecret = Environment.GetEnvironmentVariable("AlpacaSecret");

        if (alpacaApiKey == null)
        {
            throw new ArgumentNullException(alpacaApiKey);
        }

        if (alpacaSecret == null)
        {
            throw new ArgumentNullException(alpacaSecret);
        }

        // connect to Alpaca REST API
        SecretKey secretKey = new(alpacaApiKey, alpacaSecret);

        IAlpacaDataClient client = Environments.Paper.GetAlpacaDataClient(secretKey);

        // compose request (exclude last 15 minutes for free delayed quotes)
        DateTime into = DateTime.Now.Subtract(TimeSpan.FromMinutes(16));
        DateTime from = into.Subtract(TimeSpan.FromDays(800));

        HistoricalBarsRequest request = new(symbol, from, into, BarTimeFrame.Day);

        // fetch minute-bar quotes in native format
        IPage<IBar> barSet = await client.ListHistoricalBarsAsync(request);

        // compose into compatible quotes
        IEnumerable<Quote> quotes = barSet
            .Items
            .Select(bar => new Quote
            {
                Date = bar.TimeUtc,
                Open = bar.Open,
                High = bar.High,
                Low = bar.Low,
                Close = bar.Close,
                Volume = bar.Volume
            });

        string json = JsonSerializer.Serialize(quotes.OrderBy(x => x.Date));

        // store in Azure Blog
        string blobName = $"{symbol}-DAILY.json";
        await Storage.PutBlob(blobName, json);

        log.LogInformation($"Updated {blobName}");
    }
}
