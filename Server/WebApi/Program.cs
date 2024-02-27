// STARTUP CONFIGURATION

using WebApi.Services;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

IServiceCollection services = builder.Services;
ConfigurationManager configuration = builder.Configuration;

// add framework services
services.AddControllers();

// get CORS origins from appsettings
List<string> origins = [];

// reminder: production origins defined in cloud host settings » API » CORS
IConfigurationSection corsOrigins = configuration.GetSection("CorsOrigins");
string? allowedOrigin = corsOrigins["Website"];

if (!string.IsNullOrEmpty(allowedOrigin))
{
    origins.Add(item: allowedOrigin);
}

// setup CORS for website
services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy",
    cors =>
    {
        cors.AllowAnyHeader();
        cors.AllowAnyMethod();
        cors.AllowCredentials();
        cors.WithOrigins([.. origins])
            .SetIsOriginAllowedToAllowWildcardSubdomains();
    });
});

Console.WriteLine($"CORS Origin: {corsOrigins["Website"]}");

// register services
builder.Services.AddHostedService<StartupService>();

// build application
WebApplication app = builder.Build();

// Configure the HTTP request pipeline.
_ = app.Environment.IsDevelopment()
  ? app.UseDeveloperExceptionPage()
  : app.UseHsts();

app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("CorsPolicy");
app.UseResponseCaching();
app.MapControllers();
app.Run();
