namespace WebApi.Services;

public interface IStorage
{
    Task InitializeAsync(CancellationToken cancellationToken = default);
    Task PutBlobAsync(string blobName, string content);
    BlobClient GetBlobClient(string blobName);
}

public class Storage : IStorage
{
    private readonly string _containerName;
    private readonly BlobContainerClient _blobClient;
    private readonly ILogger<Storage> _logger;

    public Storage(
        IConfiguration configuration,
        ILogger<Storage> logger)
    {
        _logger = logger;

        _containerName
            = configuration.GetValue<string>("Storage:ContainerName")
            ?? "chart-demo";

        string connectionString
            = configuration.GetValue<string>("Storage:ConnectionString")
            ?? Environment.GetEnvironmentVariable("AzureWebJobsStorage")
            ?? "UseDevelopmentStorage=true";

        _blobClient = new BlobContainerClient(connectionString, _containerName);
    }

    /// <summary>
    /// Initializes the blob storage container
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Task representing the async operation</returns>
    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Initializing blob storage for container {ContainerName}...", _containerName);

            Response<BlobContainerInfo> response = await _blobClient.CreateIfNotExistsAsync(cancellationToken: cancellationToken);
            string message = response?.Value != null
                ? "Created new blob container"
                : "Using existing blob container";

            _logger.LogInformation("{Message} {ContainerName}", message, _containerName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize blob storage for {ContainerName}", _containerName);
            throw;
        }
    }

    /// <summary>
    /// Uploads content to a blob with the specified name
    /// </summary>
    /// <param name="blobName">Name of the blob</param>
    /// <param name="content">Content to upload</param>
    /// <returns>Task representing the async operation</returns>
    public async Task PutBlobAsync(string blobName, string content)
    {
        try
        {
            BlobClient blob = GetBlobClient(blobName);
            if (await blob.ExistsAsync())
            {
                _logger.LogWarning("Overwriting existing blob {BlobName}", blobName);
            }

            BlobHttpHeaders httpHeader = new() { ContentType = "application/json" };
            using MemoryStream ms = new(Encoding.UTF8.GetBytes(content));
            await blob.UploadAsync(ms, httpHeader);

            _logger.LogInformation("Successfully uploaded blob {BlobName}", blobName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload blob {BlobName}", blobName);
            throw;
        }
    }

    /// <summary>
    /// Gets a BlobClient for the specified blob name
    /// </summary>
    /// <param name="blobName">Name of the blob</param>
    /// <returns>BlobClient instance</returns>
    public BlobClient GetBlobClient(string blobName)
        => _blobClient.GetBlobClient(blobName);
}
