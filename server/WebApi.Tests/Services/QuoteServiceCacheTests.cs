using Azure.Storage.Blobs;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace WebApi.Tests.Services;

/// <summary>
/// Verifies the in-memory quote cache in <see cref="QuoteService"/>: repeat
/// requests for the same symbol are served from cache rather than re-reading
/// storage, which is what keeps a burst of indicator calls from stampeding the
/// shared quote blob.
/// </summary>
public class QuoteServiceCacheTests
{
    [Fact]
    public async Task Get_SameSymbolTwice_ReadsStorageOnce()
    {
        // Arrange — a null BlobClient forces the failover path, so Get resolves
        // to the deterministic backup dataset. The cache should still record the
        // result and short-circuit the second call before it touches storage.
        Mock<IStorage> storageMock = new();
        storageMock
            .Setup(s => s.GetBlobClient(It.IsAny<string>()))
            .Returns((BlobClient)null!);

        using MemoryCache cache = new(new MemoryCacheOptions());
        QuoteService service = new(
            Mock.Of<ILogger<QuoteService>>(),
            storageMock.Object,
            cache,
            Options.Create(new CacheSettings()));

        // Act
        IEnumerable<Bar> first = await service.Get("QQQ", CancellationToken.None);
        IEnumerable<Bar> second = await service.Get("QQQ", CancellationToken.None);

        // Assert — both calls return the same cached instance, and storage was
        // consulted exactly once across the two requests.
        Assert.NotEmpty(first);
        Assert.Same(first, second);
        storageMock.Verify(s => s.GetBlobClient(It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task Get_DifferentSymbols_AreCachedIndependently()
    {
        // Arrange
        Mock<IStorage> storageMock = new();
        storageMock
            .Setup(s => s.GetBlobClient(It.IsAny<string>()))
            .Returns((BlobClient)null!);

        using MemoryCache cache = new(new MemoryCacheOptions());
        QuoteService service = new(
            Mock.Of<ILogger<QuoteService>>(),
            storageMock.Object,
            cache,
            Options.Create(new CacheSettings()));

        // Act — each distinct symbol is loaded once; repeats are cache hits.
        await service.Get("QQQ", CancellationToken.None);
        await service.Get("SPY", CancellationToken.None);
        await service.Get("QQQ", CancellationToken.None);
        await service.Get("SPY", CancellationToken.None);

        // Assert — two distinct symbols means two storage reads, not four.
        storageMock.Verify(s => s.GetBlobClient(It.IsAny<string>()), Times.Exactly(2));
    }
}
