using System;
using Azure.Storage.Blobs;
using Microsoft.Azure.Functions.Extensions.DependencyInjection;

[assembly: FunctionsStartup(typeof(Functions.Startup))]

namespace Functions;

public class Startup : FunctionsStartup
{
    public override void Configure(IFunctionsHostBuilder builder)
    {
        // initialize Azure services (setup storage)
        string awjsConnection = Environment.GetEnvironmentVariable("AzureWebJobsStorage");

        // main blob container
        BlobContainerClient blobContainer = new(awjsConnection, "chart-demo");
        blobContainer.CreateIfNotExists();
    }
}
