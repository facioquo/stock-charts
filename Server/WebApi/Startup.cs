namespace WebApi.Services;

public class StartupService : IHostedService
{
    /// <summary>
    ///   The code in here will run when the application starts,
    ///   and block the startup process until finished
    /// </summary>
    /// <param name="cancellationToken" cref="CancellationToken></param>
    public async Task StartAsync(CancellationToken cancellationToken)
        => await Storage.Initialize(cancellationToken);

    /// <summary>
    ///   The code in here will run when the application stops.
    ///   In our case, nothing to do.
    /// </summary>
    /// <param name="cancellationToken" cref="CancellationToken></param>
    public Task StopAsync(CancellationToken cancellationToken)
        => Task.CompletedTask;
}
