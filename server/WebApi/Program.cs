// STARTUP CONFIGURATION

using System.IO.Compression;
using Microsoft.AspNetCore.ResponseCompression;
using WebApi.Services;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

IServiceCollection services = builder.Services;
ConfigurationManager configuration = builder.Configuration;

// Add framework services
services.AddControllers();

// Get CORS origins from appsettings
// reminder: production origins defined in cloud host settings » API » CORS
// so these are really only for localhost / development
IConfigurationSection corsOrigins = configuration.GetSection("CorsOrigins");
string? allowedOrigin = corsOrigins["Website"];

List<string> origins = [];

if (!string.IsNullOrEmpty(allowedOrigin))
{
    origins.Add(allowedOrigin);
}

// Setup CORS for website
services.AddCors(options => {
    options.AddPolicy("CorsPolicy",
    cors => {
        cors.AllowAnyHeader();
        cors.AllowAnyMethod();
        cors.AllowCredentials();
        cors.WithOrigins([.. origins])
            .SetIsOriginAllowedToAllowWildcardSubdomains();
    });
});

Console.WriteLine($"CORS Origin: {allowedOrigin}");

// Register services
services.AddHostedService<StartupService>();
services.AddTransient<QuoteService>();

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
