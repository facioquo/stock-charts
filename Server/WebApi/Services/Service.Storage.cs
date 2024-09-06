namespace WebApi.Services;

public static class Storage
{
    private static readonly string containerName = "chart-demo";
    private static readonly string azureWebJobStorage
        = Environment.GetEnvironmentVariable("AzureWebJobsStorage")
            ?? "UseDevelopmentStorage=true"; // failover to Azurite dev storage

    /// <summary>
    /// Initialize Azure services (setup blob storage for quotes)
    /// </summary>
    /// <param name="cancellationToken"></param>
    public static async Task Initialize(
        ILogger logger,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("API initializing ...");

        // main blob container
        BlobContainerClient blobContainer = new(azureWebJobStorage, containerName);

        Response<BlobContainerInfo> response = await blobContainer
            .CreateIfNotExistsAsync(cancellationToken: cancellationToken);

        string message = response != null
            ? $"New `{containerName}` blob container created."
            : $"Existing `{containerName}` blob container found.";

        logger.LogInformation("Blob container status: {message}", message);
    }

    /// <summary>
    /// Upload/save blob item (JSON quotes)
    /// </summary>
    /// <param name="blobName">Unique name of blob item</param>
    /// <param name="csv">JSON payload to store</param>
    public static async Task PutBlob(string blobName, string csv)
    {
        BlobClient blob = GetBlobClient(blobName);
        BlobHttpHeaders httpHeader = new() {
            ContentType = "application/json"
        };

        using MemoryStream ms = new(Encoding.UTF8.GetBytes(csv));
        ms.Position = 0;
        await blob.UploadAsync(ms, httpHeader);
    }

    /// <summary>
    /// Get Azure Blob client
    /// </summary>
    /// <param name="blobName">Unique name of blob item</param>
    /// <returns cref="BlobClient"></returns>
    internal static BlobClient GetBlobClient(string blobName)
    {
        BlobContainerClient blobContainer = new(azureWebJobStorage, containerName);
        return blobContainer.GetBlobClient(blobName);
    }
}
