using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using WebApi.Services;

IHost host = new HostBuilder()
    .ConfigureFunctionsWorkerDefaults()
    .ConfigureServices(services => {
        services.AddSingleton<IStorage, Storage>();
        services.AddHostedService<StartupServices>();
    })
    .Build();

host.Run();
