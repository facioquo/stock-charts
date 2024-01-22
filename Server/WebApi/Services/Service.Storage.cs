using System.Text;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace WebApi.Services;

public static class Storage
{
    // STARTUP
    public static async Task Startup(CancellationToken cancellationToken)
    {
        // initialize Azure services (setup storage)
        string awjsConnection = Environment.GetEnvironmentVariable("AzureWebJobsStorage");

        // main blob container
        BlobContainerClient blobContainer = new(awjsConnection, "chart-demo");

        Response<BlobContainerInfo> response = await blobContainer
            .CreateIfNotExistsAsync(cancellationToken: cancellationToken);

        // when new container
        if (response != null)
        {
            Console.WriteLine($"NOTE: New blob container `chart-demo` created {response.Value}.");
        }
        else
        {
            Console.WriteLine($"NOTE: Blob container already exists.");
        }
    }

    // SAVE BLOB
    public static async Task<bool> PutBlob(string blobName, string csv)
    {
        BlobClient blob = GetBlobReference(blobName);
        BlobHttpHeaders httpHeader = new()
        {
            ContentType = "application/json"
        };

        using MemoryStream ms = new(Encoding.UTF8.GetBytes(csv));
        ms.Position = 0;
        await blob.UploadAsync(ms, httpHeader);
        return true;
    }

    // HELPERS
    internal static BlobClient GetBlobReference(string blobName)
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
