namespace WebApi.Services;

public class StartupService(ILoggerFactory loggerFactory) : IHostedService
{
    private readonly ILogger _logger = loggerFactory.CreateLogger<StartupService>();

    /// <summary>
    /// The code in here will run when the application starts,
    /// and block the startup process until finished
    /// </summary>
    /// <param name="cancellationToken" cref="CancellationToken></param>
    public async Task StartAsync(CancellationToken cancellationToken)
        => await Storage.Initialize(_logger, cancellationToken);

    /// <summary>
    /// The code in here will run when the application stops.
    /// In our case, nothing to do.
    /// </summary>
    /// <param name="cancellationToken" cref="CancellationToken></param>
    public Task StopAsync(CancellationToken cancellationToken)
        => Task.CompletedTask;
}
