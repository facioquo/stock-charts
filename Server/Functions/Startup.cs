using Microsoft.Azure.Functions.Extensions.DependencyInjection;
using WebApi.Services;

[assembly: FunctionsStartup(typeof(Functions.Startup))]

namespace Functions;

public class Startup : FunctionsStartup
{
    public override void Configure(IFunctionsHostBuilder builder)
    {
        Storage.Startup();
    }
}
