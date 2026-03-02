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
// reminder: production origins defined in cloud host settings » API » CORS
// so these are really only for localhost / development
string? allowedOriginConfig = configuration.GetValue<string>("CorsOrigins:Website");
string[] allowedOrigins = allowedOriginConfig?.Split(';', StringSplitOptions.RemoveEmptyEntries) ?? [];

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
app.Run();
