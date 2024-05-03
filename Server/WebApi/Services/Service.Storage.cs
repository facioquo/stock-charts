namespace WebApi.Services;

public static class Storage
{
    // STARTUP
    public static async Task Startup(CancellationToken cancellationToken)
    {
        // initialize Azure services (setup storage),
        // failover to Azurite local dev storage
        string awjs = Environment
            .GetEnvironmentVariable("AzureWebJobsStorage")
                ?? "UseDevelopmentStorage=true";

        // main blob container
        BlobContainerClient blobContainer = new(awjs, "chart-demo");

        Response<BlobContainerInfo> response = await blobContainer
            .CreateIfNotExistsAsync(cancellationToken: cancellationToken);

        // when new container
        if (response != null)
        {
            Console.WriteLine(
                $"NOTE: New blob container `chart-demo` created {response.Value}.");
        }
        else
        {
            Console.WriteLine(
                $"NOTE: Blob container already exists.");
        }
    }

    // SAVE BLOB
    public static async Task<bool> PutBlob(string blobName, string csv)
    {
        BlobClient blob = GetBlobClient(blobName);
        BlobHttpHeaders httpHeader = new() {
            ContentType = "application/json"
        };

        using MemoryStream ms = new(Encoding.UTF8.GetBytes(csv));
        ms.Position = 0;
        await blob.UploadAsync(ms, httpHeader);
        return true;
    }

    // HELPERS
    internal static BlobClient GetBlobClient(string blobName)
    {
        BlobContainerClient blobContainer
            = GetContainerClient("chart-demo");

        BlobClient blob
            = blobContainer.GetBlobClient(blobName);

        return blob;
    }

    private static BlobContainerClient GetContainerClient(string containerName)
    {
        // failover to Azurite local dev storage
        string awjs = Environment
            .GetEnvironmentVariable("AzureWebJobsStorage")
                ?? "UseDevelopmentStorage=true";
        return new BlobContainerClient(awjs, containerName);
    }
}
