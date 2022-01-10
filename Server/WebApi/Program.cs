// STARTUP CONFIGURATION

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

IServiceCollection services = builder.Services;
ConfigurationManager configuration = builder.Configuration;

// add framework services
services.AddControllers()
        .AddNewtonsoftJson(x =>
           x.SerializerSettings.ReferenceLoopHandling
           = Newtonsoft.Json.ReferenceLoopHandling.Ignore);

// setup CORS for website
IConfigurationSection corsOrigins = configuration.GetSection("CorsOrigins");

services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy",
    cors =>
    {
        _ = cors.AllowAnyHeader();
        _ = cors.AllowAnyMethod();
        _ = cors.AllowCredentials();
        _ = cors.WithOrigins(corsOrigins["Website"]);
    });
});

WebApplication app = builder.Build();

// Configure the HTTP request pipeline.
_ = app.Environment.IsDevelopment()
  ? app.UseDeveloperExceptionPage()
  : app.UseHsts();

app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("CorsPolicy");
app.UseAuthentication();
app.UseEndpoints(ep =>
{
    _ = ep.MapControllers()
          .RequireCors("CorsPolicy");  // on all controllers
});

app.Run();
