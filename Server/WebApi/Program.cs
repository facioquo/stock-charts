// STARTUP CONFIGURATION

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

IServiceCollection services = builder.Services;
ConfigurationManager configuration = builder.Configuration;

// add framework services
services.AddControllers();

// get CORS origins from appsettings
IConfigurationSection corsOrigins = configuration.GetSection("CorsOrigins");
List<string> origins = [];
origins.Add(item: corsOrigins["Website"]);

// setup CORS for website
services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy",
    cors =>
    {
        cors.AllowAnyHeader();
        cors.AllowAnyMethod();
        cors.AllowCredentials();
        cors.WithOrigins([.. origins]);
    });
});

Console.WriteLine($"CORS Origins: {corsOrigins["Website"]}");

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
