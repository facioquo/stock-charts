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

// Get CORS origins from appsettings (semicolon-separated list)
// reminder: Website origins for production are in cloud host settings » API » CORS
// Demo origins supplement Website (CF Pages VitePress demo; not overridden by cloud host settings)
string? allowedOriginConfig = configuration.GetValue<string>("CorsOrigins:Website");
string[] websiteOrigins = allowedOriginConfig?.Split(';', StringSplitOptions.RemoveEmptyEntries) ?? [];

string? demoOriginConfig = configuration.GetValue<string>("CorsOrigins:Demo");
string[] demoOrigins = demoOriginConfig?.Split(';', StringSplitOptions.RemoveEmptyEntries) ?? [];

string[] allowedOrigins = [.. websiteOrigins, .. demoOrigins];

if (allowedOrigins.Length > 0)
{
    // Setup CORS for website
    services.AddCors(options => {
        options.AddPolicy("CorsPolicy",
        cors => {
            cors.AllowAnyHeader();
            cors.AllowAnyMethod();
            cors.AllowCredentials();
            cors.WithOrigins(allowedOrigins)
                .SetIsOriginAllowedToAllowWildcardSubdomains();
        });
    });

    Console.WriteLine($"CORS Origins: {string.Join(", ", allowedOrigins)}");
}

// Add response compression services
services.AddResponseCompression(options => {
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});

// Configure compression options
services.Configure<BrotliCompressionProviderOptions>(
    options => options.Level = CompressionLevel.Fastest);

services.Configure<GzipCompressionProviderOptions>(
    options => options.Level = CompressionLevel.Fastest);

// Add logging
services.AddLogging();

// Caching configuration (shared by output cache, quote cache, and client headers)
services.Configure<CacheSettings>(configuration.GetSection(CacheSettings.SectionName));
CacheSettings cacheSettings = new();
configuration.GetSection(CacheSettings.SectionName).Bind(cacheSettings);

// In-memory cache for quote data, so an output-cache miss for one indicator
// does not re-download the shared quote blob for every other indicator.
services.AddMemoryCache();

// Server-side output cache for computed indicator responses. Varies by the
// full query string (so each parameter set is a distinct entry) and by Origin
// (so cached responses keep the correct per-origin CORS headers).
services.AddOutputCache(options =>
    options.AddPolicy(OutputCachePolicies.IndicatorData, policy => policy
        .Expire(cacheSettings.Duration)
        .SetVaryByQuery("*")
        .SetVaryByHeader("Origin")));

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
app.UseOutputCache();
app.UseResponseCompression();

// Controller endpoints
app.MapControllers();
app.Run();
