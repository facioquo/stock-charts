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
        await StoreQuoteDaily("TSLA", log);

        log.LogInformation($"Quotes updated at: {DateTime.Now}, {myTimer.ScheduleStatus}");
    }

    // STORE QUOTE
    private static async Task StoreQuoteDaily(string symbol, ILogger log)
    {
        string alpacaApiKey = Environment.GetEnvironmentVariable("AlpacaApiKey");
        string alpacaSecret = Environment.GetEnvironmentVariable("AlpacaSecret");

        // fetch from Alpaca paper trading API
        IAlpacaDataClient alpacaDataClient = Environments.Paper
            .GetAlpacaDataClient(new SecretKey(alpacaApiKey, alpacaSecret));

        DateTime into = DateTime.Now.Subtract(TimeSpan.FromMinutes(16));
        DateTime from = into.Subtract(TimeSpan.FromDays(800));

        IPage<IBar> barSet = await alpacaDataClient.ListHistoricalBarsAsync(
            new HistoricalBarsRequest(symbol, from, into, BarTimeFrame.Day));

        List<Quote> quotes = new(barSet.Items.Count);

        // compose
        foreach (IBar bar in barSet.Items)
        {
            Quote q = new()
            {
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

        log.LogInformation($"Updated {blobName}");
    }
}
