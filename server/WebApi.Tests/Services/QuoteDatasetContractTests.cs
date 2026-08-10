using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace WebApi.Tests.Services;

/// <summary>
/// Pins the wire contract between the edge Worker that publishes quote datasets
/// to R2 and <see cref="QuoteService"/>, which reads them back.
/// </summary>
/// <remarks>
/// The two sides are written in different languages and share only
/// <c>server/quote-dataset.contract.json</c>. <see cref="QuoteService"/>
/// deserializes with default <see cref="JsonSerializerOptions"/>, so property
/// naming is case-sensitive: a Worker that emitted camelCase would produce a
/// dataset that parses into default-valued bars instead of failing loudly. The
/// matching TypeScript assertion lives in
/// <c>server/edge/src/quotes.spec.ts</c>; both read this same fixture.
/// </remarks>
public class QuoteDatasetContractTests
{
    private static Task<string> ContractJsonAsync(CancellationToken cancellationToken)
        => File.ReadAllTextAsync(Path.Combine(AppContext.BaseDirectory, "quote-dataset.contract.json"), cancellationToken);

    [Fact]
    public async Task ContractFixture_DeserializesIntoFullyPopulatedBars()
    {
        // Act
        string json = await ContractJsonAsync(TestContext.Current.CancellationToken);
        List<Bar>? bars = JsonSerializer.Deserialize<List<Bar>>(json);

        // Assert — every field materializes; none fall back to a default.
        Assert.NotNull(bars);
        Assert.Equal(3, bars.Count);

        Bar first = bars[0];
        Assert.Equal(new DateTime(2026, 7, 29, 4, 0, 0, DateTimeKind.Utc), first.Timestamp.ToUniversalTime());
        Assert.Equal(561.23m, first.Open);
        Assert.Equal(564.80m, first.High);
        Assert.Equal(559.11m, first.Low);
        Assert.Equal(563.47m, first.Close);
        Assert.Equal(41230100m, first.Volume);
    }

    [Fact]
    public async Task QuoteService_ReadsContractFixtureFromStore()
    {
        // Arrange — the store hands back exactly the bytes the Worker writes.
        string json = await ContractJsonAsync(TestContext.Current.CancellationToken);

        Mock<IQuoteStore> storeMock = new();
        storeMock
            .Setup(s => s.OpenQuotesAsync("QQQ", It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new MemoryStream(Encoding.UTF8.GetBytes(json)));

        using MemoryCache cache = new(new MemoryCacheOptions());
        QuoteService service = new(
            Mock.Of<ILogger<QuoteService>>(),
            storeMock.Object,
            cache,
            Options.Create(new CacheSettings()));

        // Act
        List<Bar> quotes = [.. await service.Get("QQQ", CancellationToken.None)];

        // Assert — the published dataset is served, not the backup failover.
        Assert.Equal(3, quotes.Count);
        Assert.Equal(567.19m, quotes[^1].Close);
    }
}
