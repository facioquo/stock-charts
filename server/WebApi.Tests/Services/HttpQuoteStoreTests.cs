using System.Net;
using System.Text;
using Microsoft.Extensions.Logging;
using Moq;

namespace WebApi.Tests.Services;

/// <summary>
/// Covers <see cref="HttpQuoteStore"/>, which reads quote datasets over HTTP.
/// In production the configured base address resolves to an R2 bucket that the
/// edge Worker exposes to the API container, so these tests stand in for that
/// hop with a stub handler.
/// </summary>
public class HttpQuoteStoreTests
{
    // Stand-in host. The store's behaviour is scheme- and host-independent; the
    // real address is supplied by the edge Worker at runtime.
    private const string BaseAddress = "https://quotes.example/";

    /// <summary>Records the request it received and replays a canned response.</summary>
    private sealed class StubHandler(HttpStatusCode status, string? body = null) : HttpMessageHandler
    {
        public Uri? RequestedUri { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            RequestedUri = request.RequestUri;

            HttpResponseMessage response = new(status);

            if (body is not null)
            {
                response.Content = new StringContent(body, Encoding.UTF8, "application/json");
            }

            return Task.FromResult(response);
        }
    }

    private static HttpQuoteStore CreateStore(HttpMessageHandler handler)
    {
        HttpClient client = new(handler) { BaseAddress = new Uri(BaseAddress) };

        Mock<IHttpClientFactory> factoryMock = new();
        factoryMock
            .Setup(f => f.CreateClient(HttpQuoteStore.HttpClientName))
            .Returns(client);

        return new HttpQuoteStore(factoryMock.Object, Mock.Of<ILogger<HttpQuoteStore>>());
    }

    [Fact]
    public async Task OpenQuotesAsync_RequestsTheDatasetObjectNameForTheSymbol()
    {
        // Arrange
        using StubHandler handler = new(HttpStatusCode.OK, "[]");
        HttpQuoteStore store = CreateStore(handler);

        // Act
        await using Stream? stream = await store.OpenQuotesAsync("QQQ", CancellationToken.None);

        // Assert — the object name must match what the edge Worker writes to R2.
        Assert.Equal(new Uri($"{BaseAddress}QQQ-DAILY.json"), handler.RequestedUri);
    }

    [Fact]
    public async Task OpenQuotesAsync_WhenPublished_ReturnsReadableStream()
    {
        // Arrange
        const string payload = """[{"Timestamp":"2026-07-31T04:00:00Z"}]""";
        using StubHandler handler = new(HttpStatusCode.OK, payload);
        HttpQuoteStore store = CreateStore(handler);

        // Act
        await using Stream? stream = await store.OpenQuotesAsync("SPY", CancellationToken.None);

        // Assert — the stream is buffered and positioned at the start, so the
        // caller can deserialize it after the HTTP response has been disposed.
        Assert.NotNull(stream);
        using StreamReader reader = new(stream);
        Assert.Equal(payload, await reader.ReadToEndAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task OpenQuotesAsync_WhenNotPublished_ReturnsNull()
    {
        // Arrange — a 404 means "no dataset published yet", which QuoteService
        // translates into its bundled backup dataset rather than an error.
        using StubHandler handler = new(HttpStatusCode.NotFound);
        HttpQuoteStore store = CreateStore(handler);

        // Act
        await using Stream? stream = await store.OpenQuotesAsync("QQQ", CancellationToken.None);

        // Assert
        Assert.Null(stream);
    }

    [Fact]
    public async Task OpenQuotesAsync_WithNoQuoteHostConfigured_ReturnsNull()
    {
        // Arrange — Quotes:BaseUrl unset leaves BaseAddress null, which is the
        // normal local-development state. It must read as "nothing published"
        // rather than throwing once per request.
        using StubHandler handler = new(HttpStatusCode.OK, "[]");
        HttpClient client = new(handler);

        Mock<IHttpClientFactory> factoryMock = new();
        factoryMock
            .Setup(f => f.CreateClient(HttpQuoteStore.HttpClientName))
            .Returns(client);

        HttpQuoteStore store = new(factoryMock.Object, Mock.Of<ILogger<HttpQuoteStore>>());

        // Act
        await using Stream? stream = await store.OpenQuotesAsync("QQQ", CancellationToken.None);

        // Assert — no request was attempted.
        Assert.Null(stream);
        Assert.Null(handler.RequestedUri);
    }

    [Fact]
    public async Task OpenQuotesAsync_OnServerError_Throws()
    {
        // Arrange — anything other than 404 is a genuine fault. It surfaces here
        // so QuoteService logs it before failing over, rather than being
        // silently indistinguishable from an unpublished dataset.
        using StubHandler handler = new(HttpStatusCode.InternalServerError);
        HttpQuoteStore store = CreateStore(handler);

        // Act / Assert
        await Assert.ThrowsAsync<HttpRequestException>(
            () => store.OpenQuotesAsync("QQQ", CancellationToken.None));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task OpenQuotesAsync_WithBlankSymbol_Throws(string symbol)
    {
        // Arrange
        using StubHandler handler = new(HttpStatusCode.OK, "[]");
        HttpQuoteStore store = CreateStore(handler);

        // Act / Assert
        await Assert.ThrowsAsync<ArgumentException>(
            () => store.OpenQuotesAsync(symbol, CancellationToken.None));
    }

    [Fact]
    public async Task OpenQuotesAsync_WithCancelledToken_Throws()
    {
        // Arrange — the stub handler's SendAsync checks the token itself
        // (mirroring what the real HttpClient pipeline does), so this exercises
        // the same cancellation path a genuine request timeout would take.
        using StubHandler handler = new(HttpStatusCode.OK, "[]");
        HttpQuoteStore store = CreateStore(handler);

        using CancellationTokenSource cts = new();
        await cts.CancelAsync();

        // Act / Assert
        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => store.OpenQuotesAsync("QQQ", cts.Token));
    }
}
