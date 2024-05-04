namespace WebApi.Services;

public static class Storage
{
    /// <summary>
    ///   Initialize Azure services (setup blob storage for quotes)
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public static async Task Initialize(CancellationToken cancellationToken)
    {
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

    /// <summary>
    ///   Upload/save blob item (CSV quotes)
    /// </summary>
    /// <param name="blobName">Unique name of blob item</param>
    /// <param name="csv">CSV payload to store</param>
    /// <returns>True/false success</returns>
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

    /// <summary>
    ///   Get Azure Blob client
    /// </summary>
    /// <param name="blobName">Unique name of blob item</param>
    /// <returns cref="BlobClient"></returns>
    internal static BlobClient GetBlobClient(string blobName)
    {
        BlobContainerClient blobContainer
            = GetContainerClient("chart-demo");

        BlobClient blob
            = blobContainer.GetBlobClient(blobName);

        return blob;
    }

    /// <summary>
    ///   Get blob storage container client
    /// </summary>
    /// <param name="containerName">Unique name of blob container (e.g. "chart-demo")</param>
    /// <returns cref="BlobContainerClient"></returns>
    private static BlobContainerClient GetContainerClient(string containerName)
    {
        // failover to Azurite local dev storage
        string awjs = Environment
            .GetEnvironmentVariable("AzureWebJobsStorage")
                ?? "UseDevelopmentStorage=true";
        return new BlobContainerClient(awjs, containerName);
    }
}
