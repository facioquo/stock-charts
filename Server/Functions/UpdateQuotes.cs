using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Alpaca.Markets;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Azure.WebJobs;
using Microsoft.Extensions.Logging;

namespace Functions;

public class Jobs
{
    [FunctionName("UpdateQuotes")]
    public static async Task Run([TimerTrigger("0 */1 08-18 * * 1-5")] TimerInfo myTimer, ILogger log)
    {
        // ~ extended market hours, every minute "0 */1 08-18 * * 1-5"
        // for dev: minutely "0 */1 * * * *"
        await StoreQuoteDaily("DIA", log);
        await StoreQuoteDaily("SPY", log);
        await StoreQuoteDaily("QQQ", log);

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

        // compose CSV
        string csv = string.Empty;
        foreach (IBar bar in barSet.Items)
        {
            csv += $"{bar.TimeUtc:d},{bar.Open},{bar.High},{bar.Low},{bar.Close},{bar.Volume}\r\n";
        }

        // store in Azure Blog
        string blobName = $"{symbol}-DAILY.csv";
        await PutBlob(blobName, csv);

        log.LogInformation($"Updated {blobName}");
    }

    // SAVE BLOB
    private static async Task<bool> PutBlob(string blobName, string csv)
    {
        BlobClient blob = GetBlobReference(blobName);
        BlobHttpHeaders httpHeader = new()
        {
            ContentType = "application/text"
        };

        using (MemoryStream ms = new(Encoding.UTF8.GetBytes(csv)))
        {
            ms.Position = 0;
            await blob.UploadAsync(ms, httpHeader);
        };
        return true;
    }

    // HELPERS
    private static BlobClient GetBlobReference(string blobName)
    {
        BlobContainerClient blobContainer = GetContainerReference("chart-demo");
        BlobClient blob = blobContainer.GetBlobClient(blobName);

        return blob;
    }

    private static BlobContainerClient GetContainerReference(string containerName)
    {
        string awjsConnection = Environment.GetEnvironmentVariable("AzureWebJobsStorage");
        return new BlobContainerClient(awjsConnection, containerName);
    }
}
