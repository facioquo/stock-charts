using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace WebApi.Tests.Services;

/// <summary>
/// Verifies the in-memory quote cache in <see cref="QuoteService"/>: repeat
/// requests for the same symbol are served from cache rather than re-reading
/// storage, which is what keeps a burst of indicator calls from stampeding the
/// shared quote dataset.
/// </summary>
public class QuoteServiceCacheTests
{
    /// <summary>
    /// A store that reports "no dataset published" forces the failover path, so
    /// Get resolves to the deterministic backup dataset while still exercising
    /// the caching behaviour under test.
    /// </summary>
    private static Mock<IQuoteStore> EmptyStore()
    {
        Mock<IQuoteStore> storeMock = new();
        storeMock
            .Setup(s => s.OpenQuotesAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Stream?)null);

        return storeMock;
    }

    [Fact]
    public async Task Get_SameSymbolTwice_ReadsStorageOnce()
    {
        // Arrange
        Mock<IQuoteStore> storeMock = EmptyStore();

        using MemoryCache cache = new(new MemoryCacheOptions());
        QuoteService service = new(
            Mock.Of<ILogger<QuoteService>>(),
            storeMock.Object,
            cache,
            Options.Create(new CacheSettings()));

        // Act
        IEnumerable<Bar> first = await service.Get("QQQ", CancellationToken.None);
        IEnumerable<Bar> second = await service.Get("QQQ", CancellationToken.None);

        // Assert — both calls return the same cached instance, and storage was
        // consulted exactly once across the two requests.
        Assert.NotEmpty(first);
        Assert.Same(first, second);
        storeMock.Verify(
            s => s.OpenQuotesAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Get_DifferentSymbols_AreCachedIndependently()
    {
        // Arrange
        Mock<IQuoteStore> storeMock = EmptyStore();

        using MemoryCache cache = new(new MemoryCacheOptions());
        QuoteService service = new(
            Mock.Of<ILogger<QuoteService>>(),
            storeMock.Object,
            cache,
            Options.Create(new CacheSettings()));

        // Act — each distinct symbol is loaded once; repeats are cache hits.
        await service.Get("QQQ", CancellationToken.None);
        await service.Get("SPY", CancellationToken.None);
        await service.Get("QQQ", CancellationToken.None);
        await service.Get("SPY", CancellationToken.None);

        // Assert — two distinct symbols means two storage reads, not four, and
        // each read is for the symbol it was cached under (not e.g. both reads
        // for the same symbol by coincidence of count).
        storeMock.Verify(
            s => s.OpenQuotesAsync("QQQ", It.IsAny<CancellationToken>()),
            Times.Once);
        storeMock.Verify(
            s => s.OpenQuotesAsync("SPY", It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
