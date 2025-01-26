namespace WebApi.Services;

public class StartupServices(
    ILogger<StartupServices> logger,
    IStorage storage) : IHostedService
{
    private readonly ILogger<StartupServices> _logger = logger;
    private readonly IStorage _storage = storage;

    /// <summary>
    /// The code in here will run when the application starts,
    /// and block the startup process until finished
    /// </summary>
    /// <param name="cancellationToken" cref="CancellationToken></param>
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Initializing storage service.");
        await _storage.InitializeAsync(cancellationToken);
        _logger.LogInformation("Done initializing storage.");
    }

    /// <summary>
    /// The code in here will run when the application stops.
    /// In our case, nothing to do.
    /// </summary>
    /// <param name="cancellationToken" cref="CancellationToken></param>
    public Task StopAsync(CancellationToken cancellationToken)
        => Task.CompletedTask;
}
