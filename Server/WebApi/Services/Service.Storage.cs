using System.Text;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace WebApi.Services;

public class Storage
{
    // STARTUP
    public static void Startup()
    {
        // initialize Azure services (setup storage)
        string awjsConnection = Environment.GetEnvironmentVariable("AzureWebJobsStorage");

        // main blob container
        BlobContainerClient blobContainer = new(awjsConnection, "chart-demo");
        blobContainer.CreateIfNotExists();
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
