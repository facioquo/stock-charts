// STARTUP CONFIGURATION

using System.IO.Compression;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.Azure;
using WebApi.Services;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);
ConfigurationManager configuration = builder.Configuration;
IServiceCollection services = builder.Services;

// Add framework services
services.AddControllers();

// Get CORS origins from appsettings
// reminder: production origins defined in cloud host settings » API » CORS
// so these are really only for localhost / development
string? allowedOrigin = configuration.GetValue<string>("CorsOrigins:Website");

if (!string.IsNullOrEmpty(allowedOrigin))
{
    // Setup CORS for website
    services.AddCors(options => {
        options.AddPolicy("CorsPolicy",
        cors => {
            cors.AllowAnyHeader();
            cors.AllowAnyMethod();
            cors.AllowCredentials();
            cors.WithOrigins(allowedOrigin)
                .SetIsOriginAllowedToAllowWildcardSubdomains();
        });
    });

    Console.WriteLine($"CORS Origin: {allowedOrigin}");
}

// Add response compression services
services.AddResponseCompression(options => {
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});

// Configure compression options
services.Configure<BrotliCompressionProviderOptions>(options => {
    options.Level = CompressionLevel.Fastest;
});

services.Configure<GzipCompressionProviderOptions>(options => {
    options.Level = CompressionLevel.Fastest;
});

// Add logging
services.AddLogging();

// Add Azure dependencies
services.AddAzureClients(builder => {
    builder.AddBlobServiceClient(configuration.GetValue<string>("Storage:ConnectionString")
        ?? "UseDevelopmentStorage=true");
});

// Add application services
services.AddSingleton<IStorage, Storage>();
services.AddSingleton<IQuoteService, QuoteService>();
services.AddHostedService<StartupServices>();

// Build application
WebApplication app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("CorsPolicy");
app.UseResponseCaching();
app.UseResponseCompression();

// Controller endpoints
app.MapControllers();
// Simple health endpoint for readiness probes
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.Run();

// Expose Program class for WebApplicationFactory integration tests
public partial class Program 
{ 
    protected Program() { }
}
