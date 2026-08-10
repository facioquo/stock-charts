// STARTUP CONFIGURATION

using System.IO.Compression;
using Microsoft.AspNetCore.ResponseCompression;
using WebApi.Services;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);
ConfigurationManager configuration = builder.Configuration;
IServiceCollection services = builder.Services;

// Add framework services
services.AddControllers();

// Get CORS origins from appsettings (semicolon-separated list)
// reminder: in production the edge Worker owns CORS — it answers preflight
// without waking this container and rewrites Access-Control-* on every response
// (see server/edge/src/index.ts). This policy is what makes direct hosting and
// local development (`dotnet run` against the Vite dev server) work.
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

// Public origin used to build absolute URLs in the indicator catalog
services.Configure<ApiSettings>(configuration.GetSection(ApiSettings.SectionName));

// Quote datasets are fetched over HTTP from whatever host supplies them. In
// production that is the edge Worker, which sets Quotes:BaseUrl to an internal
// hostname it resolves through its R2 binding — see the envVars block in
// server/edge/src/container.ts, the single source of truth for that address, so
// no storage credentials are needed here. Leaving it unset (the norm for local
// development) makes QuoteService serve its bundled backup dataset.
string? quotesBaseUrl = configuration.GetValue<string>("Quotes:BaseUrl");

services.AddHttpClient(HttpQuoteStore.HttpClientName, client => {
    if (!string.IsNullOrWhiteSpace(quotesBaseUrl))
    {
        // Trailing slash is required: relative object names resolve against it.
        client.BaseAddress = new Uri(quotesBaseUrl.TrimEnd('/') + '/');
    }

    client.Timeout = TimeSpan.FromSeconds(10);
});

// Add application services
services.AddSingleton<IQuoteStore, HttpQuoteStore>();
services.AddSingleton<IQuoteService, QuoteService>();

// Build application
WebApplication app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

// No HTTPS redirection or HSTS here: TLS terminates at the edge and the
// Worker-to-container hop is plain HTTP on the container port. Redirecting
// would bounce every proxied request to an unreachable https://localhost.
app.UseRouting();
app.UseCors("CorsPolicy");
app.UseOutputCache();
app.UseResponseCompression();

// Controller endpoints
app.MapControllers();
app.Run();
