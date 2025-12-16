namespace WebApi.Services;

public interface IStorage
{
    Task InitializeAsync();
    Task InitializeAsync(CancellationToken cancellationToken);
    Task PutBlobAsync(string blobName, string content);
    BlobClient GetBlobClient(string blobName);
}

public class Storage : IStorage
{
    private readonly BlobContainerClient _blobClient;

    public Storage(IConfiguration configuration)
    {
        string containerName
            = configuration.GetValue<string>("Storage:ContainerName")
            ?? "chart-demo";

        string connectionString
            = configuration.GetValue<string>("Storage:ConnectionString")
            ?? Environment.GetEnvironmentVariable("AzureWebJobsStorage")
            ?? "UseDevelopmentStorage=true";

        _blobClient = new BlobContainerClient(connectionString, containerName);
    }

    /// <summary>
    /// Initializes the blob storage container
    /// </summary>
    /// <returns>Task representing the async operation</returns>
    public Task InitializeAsync() => InitializeAsync(CancellationToken.None);

    public async Task InitializeAsync(CancellationToken cancellationToken)
        => await _blobClient.CreateIfNotExistsAsync(cancellationToken: cancellationToken);

    /// <summary>
    /// Uploads content to a blob with the specified name
    /// </summary>
    /// <param name="blobName">Name of the blob</param>
    /// <param name="content">Content to upload</param>
    /// <returns>Task representing the async operation</returns>
    public async Task PutBlobAsync(string blobName, string content)
    {
        await using MemoryStream stream = new(Encoding.UTF8.GetBytes(content));
        await _blobClient.GetBlobClient(blobName).UploadAsync(stream, overwrite: true);
    }

    /// <summary>
    /// Gets a BlobClient for the specified blob name
    /// </summary>
    /// <param name="blobName">Name of the blob</param>
    /// <returns>BlobClient instance</returns>
    public BlobClient GetBlobClient(string blobName)
        => _blobClient.GetBlobClient(blobName);
}
