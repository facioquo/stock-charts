using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace WebApi.Tests.Endpoints;

// Custom factory to bypass external storage and provide deterministic quotes
public class QuotesTestFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder) => builder.ConfigureServices(services => {
        // Remove hosted startup services that initialize storage
        List<ServiceDescriptor> hosted = services
            .Where(d => d.ServiceType == typeof(IHostedService) && d.ImplementationType == typeof(StartupServices))
            .ToList();
        foreach (ServiceDescriptor? d in hosted)
        {
            services.Remove(d);
        }

        // Replace quote service with fake implementation returning many quotes
        List<ServiceDescriptor> quoteSvcDescriptors = services.Where(s => s.ServiceType == typeof(IQuoteService)).ToList();
        foreach (ServiceDescriptor? d in quoteSvcDescriptors)
        {
            services.Remove(d);
        }

        services.AddSingleton<IQuoteService, FakeQuoteService>();
    });
}

internal class FakeQuoteService : IQuoteService
{
    private readonly List<Quote> _quotes;

    public FakeQuoteService()
    {
        _quotes = new List<Quote>();
        DateTime start = new(2020, 1, 1);
        decimal price = 100m;
        for (int i = 0; i < 6000; i++)
        {
            DateTime date = start.AddDays(i);
            price += ((i % 10) - 5) * 0.1m; // mild drift
            decimal open = price;
            decimal close = price + (((i % 3) - 1) * 0.2m);
            decimal high = Math.Max(open, close) + 0.5m;
            decimal low = Math.Min(open, close) - 0.5m;
            _quotes.Add(new Quote { Date = date, Open = open, High = high, Low = low, Close = close, Volume = 1000000 + i });
        }
    }

    public Task<IEnumerable<Quote>> Get() => Task.FromResult<IEnumerable<Quote>>(_quotes);
    public Task<IEnumerable<Quote>> Get(string symbol) => Task.FromResult<IEnumerable<Quote>>(_quotes);
}

public class QuotesEndpointTests(QuotesTestFactory factory) : IClassFixture<QuotesTestFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Quotes_DefaultLimit_Returns120()
    {
        HttpResponseMessage response = await _client.GetAsync("/quotes");
        response.EnsureSuccessStatusCode();
        List<Quote>? quotes = await response.Content.ReadFromJsonAsync<List<Quote>>();
        Assert.NotNull(quotes);
        Assert.Equal(120, quotes!.Count);
    }

    [Fact]
    public async Task Quotes_CustomLimit_ReturnsRequested()
    {
        const int requested = 75;
        HttpResponseMessage response = await _client.GetAsync($"/quotes?limit={requested}");
        response.EnsureSuccessStatusCode();
        List<Quote>? quotes = await response.Content.ReadFromJsonAsync<List<Quote>>();
        Assert.NotNull(quotes);
        Assert.Equal(requested, quotes!.Count);
    }

    [Fact]
    public async Task Quotes_LimitTooLarge_IsClamped()
    {
        const int requested = 999999; // above cap 5000
        HttpResponseMessage response = await _client.GetAsync($"/quotes?limit={requested}");
        response.EnsureSuccessStatusCode();
        List<Quote>? quotes = await response.Content.ReadFromJsonAsync<List<Quote>>();
        Assert.NotNull(quotes);
        Assert.True(quotes!.Count <= 5000, $"Expected clamped <=5000 count but got {quotes!.Count}");
    }
}
