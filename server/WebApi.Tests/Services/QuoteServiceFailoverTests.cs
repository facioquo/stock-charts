using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace WebApi.Tests.Services;

/// <summary>
/// Verifies which symbols the bundled failover dataset stands in for. It is one
/// security's history, so serving it for a second symbol would present that
/// history as another security's — and any indicator comparing the two would
/// silently be comparing a series against itself.
/// </summary>
public class QuoteServiceFailoverTests
{
    // A store that reports "no dataset published" for every symbol, which is
    // the normal state locally and whenever storage is unreachable.
    private static QuoteService ServiceWithNoStoredQuotes(MemoryCache cache)
    {
        Mock<IQuoteStore> storeMock = new();
        storeMock
            .Setup(s => s.OpenQuotesAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Stream?)null);

        return new QuoteService(
            Mock.Of<ILogger<QuoteService>>(),
            storeMock.Object,
            cache,
            Options.Create(new CacheSettings()));
    }

    [Fact]
    public async Task Get_DefaultSymbol_FallsBackToTheBundledDataset()
    {
        // Arrange
        using MemoryCache cache = new(new MemoryCacheOptions());
        QuoteService service = ServiceWithNoStoredQuotes(cache);

        // Act
        IEnumerable<Bar> quotes = await service.Get(CancellationToken.None);

        // Assert — the showcase still charts on a fresh clone with no credentials.
        Assert.NotEmpty(quotes);
    }

    [Fact]
    public async Task Get_NonDefaultSymbol_ReturnsNothingRatherThanAnotherSymbolsHistory()
    {
        // Arrange
        using MemoryCache cache = new(new MemoryCacheOptions());
        QuoteService service = ServiceWithNoStoredQuotes(cache);

        // Act
        IEnumerable<Bar> benchmark = await service.Get("SPY", CancellationToken.None);

        // Assert
        Assert.Empty(benchmark);
    }

    [Fact]
    public async Task Get_OnFailover_DoesNotServeTheSameSeriesForBothSymbols()
    {
        // Arrange — this is the regression guard. When both symbols resolved to
        // the same bundled dataset, CORRELATION returned exactly 1.0 at every
        // point, BETA exactly 1, and PRS zero, with nothing in the response
        // marking the values as meaningless.
        using MemoryCache cache = new(new MemoryCacheOptions());
        QuoteService service = ServiceWithNoStoredQuotes(cache);

        // Act
        List<Bar> evaluated = (await service.Get(CancellationToken.None)).ToList();
        List<Bar> benchmark = (await service.Get("SPY", CancellationToken.None)).ToList();

        // Assert
        Assert.NotEmpty(evaluated);
        Assert.NotEqual(evaluated.Count, benchmark.Count);
    }
}
