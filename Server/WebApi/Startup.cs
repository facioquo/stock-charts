namespace WebApi.Services;

public class StartupService : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        // The code in here will run when the application starts,
        // and block the startup process until finished

        await Storage.Startup(cancellationToken);
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        // The code in here will run when the application stops
        // In your case, nothing to do

        return Task.CompletedTask;
    }
}
