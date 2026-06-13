using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using WebApi.Controllers;

namespace WebApi.Tests.Endpoints;

/// <summary>
/// Unit tests for Main controller endpoints.
/// Tests endpoint initialization and basic functionality.
/// </summary>
public class MainEndpointsTests
{
    private readonly Mock<IQuoteService> _quoteServiceMock;
    private readonly Main _controller;

    public MainEndpointsTests()
    {
        _quoteServiceMock = new Mock<IQuoteService>();
        _controller = new Main(_quoteServiceMock.Object);
    }

    [Fact]
    public void Get_ReturnsHealthCheckMessage()
    {
        // Act
        string result = _controller.Get();

        // Assert
        Assert.NotNull(result);
        Assert.Contains("functioning", result, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetQuotes_WithValidData_ReturnsOkResult()
    {
        // Arrange
        Quote[] sampleQuotes = new[]
        {
            new Quote(DateTime.UtcNow, 100m, 102m, 99m, 101m, 1000000),
            new Quote(DateTime.UtcNow.AddDays(-1), 99m, 101m, 98m, 100m, 900000)
        };

        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        // Setup HttpContext for the controller
        DefaultHttpContext httpContext = new();
        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act
        IActionResult result = await _controller.GetQuotes();

        // Assert
        Assert.IsType<OkObjectResult>(result);
        OkObjectResult okResult = (OkObjectResult)result;
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public void GetIndicatorCatalog_ReturnsOkResultWithMetadata()
    {
        // Arrange
        DefaultHttpContext httpContext = new();
        HttpRequest request = httpContext.Request;
        request.Scheme = "https";
        request.Host = new HostString("localhost:5001");

        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act
        IActionResult result = _controller.GetIndicatorCatalog();

        // Assert
        Assert.IsType<OkObjectResult>(result);
        OkObjectResult okResult = (OkObjectResult)result;
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task GetAdl_WithValidQuotes_ReturnsOkResult()
    {
        // Arrange
        List<Quote> sampleQuotes = GenerateSampleQuotes(50);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        DefaultHttpContext httpContext = new();
        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act
        IActionResult result = await _controller.GetAdl();

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetAdx_WithValidParameters_ReturnsOkResult()
    {
        // Arrange
        List<Quote> sampleQuotes = GenerateSampleQuotes(50);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        DefaultHttpContext httpContext = new();
        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act
        IActionResult result = await _controller.GetAdx(14);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetRsi_WithValidParameters_ReturnsOkResult()
    {
        // Arrange
        List<Quote> sampleQuotes = GenerateSampleQuotes(50);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        DefaultHttpContext httpContext = new();
        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act
        IActionResult result = await _controller.GetRsi(14);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetMacd_WithValidParameters_ReturnsOkResult()
    {
        // Arrange
        List<Quote> sampleQuotes = GenerateSampleQuotes(50);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        DefaultHttpContext httpContext = new();
        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act
        IActionResult result = await _controller.GetMacd(12, 26, 9);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetBollingerBands_WithValidParameters_ReturnsOkResult()
    {
        // Arrange
        List<Quote> sampleQuotes = GenerateSampleQuotes(50);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        DefaultHttpContext httpContext = new();
        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act
        IActionResult result = await _controller.GetBollingerBands(20, 2.0);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetSma_WithValidParameters_ReturnsOkResult()
    {
        // Arrange
        List<Quote> sampleQuotes = GenerateSampleQuotes(50);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        DefaultHttpContext httpContext = new();
        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act
        IActionResult result = await _controller.GetSma(20);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetVwap_WithValidQuotes_ReturnsOkResult()
    {
        // Arrange — generate enough quotes so TakeLast(limitLast) has a first element
        var sampleQuotes = GenerateSampleQuotes(150);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        var httpContext = new DefaultHttpContext();
        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act
        var result = await _controller.GetVwap();

        // Assert — anchor is the first of the last limitLast (120) quotes, so the
        // sliced response carries exactly 120 results, every one with a computed
        // (non-null) VWAP. A bare status-code check would let a regression that
        // returns fewer rows or leaks pre-anchor nulls pass silently.
        var okResult = Assert.IsType<OkObjectResult>(result);
        var vwap = Assert.IsAssignableFrom<IEnumerable<VwapResult>>(okResult.Value).ToList();
        Assert.Equal(120, vwap.Count);
        Assert.All(vwap, r => Assert.NotNull(r.Vwap));
        // Anchor contract: the line must begin at the first candle of the visible
        // window. A regression that anchors at the dataset origin (the prior bug
        // that stretched the shared x-axis and crushed every chart) would surface
        // here as a mismatched first timestamp.
        Assert.Equal(sampleQuotes.TakeLast(120).First().Timestamp, vwap.First().Timestamp);
    }

    [Fact]
    public async Task GetVwap_WithFewerThanLimitLastQuotes_ReturnsOkResult()
    {
        // Arrange — fewer quotes than the limitLast window; all should be visible
        var sampleQuotes = GenerateSampleQuotes(50);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        var httpContext = new DefaultHttpContext();
        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act
        var result = await _controller.GetVwap();

        // Assert — fewer quotes than the window means the anchor falls on the
        // first quote, so all 50 rows are visible and every VWAP is computed.
        var okResult = Assert.IsType<OkObjectResult>(result);
        var vwap = Assert.IsAssignableFrom<IEnumerable<VwapResult>>(okResult.Value).ToList();
        Assert.Equal(50, vwap.Count);
        Assert.All(vwap, r => Assert.NotNull(r.Vwap));
        // With fewer quotes than the window, the anchor falls on the very first quote.
        Assert.Equal(sampleQuotes.First().Timestamp, vwap.First().Timestamp);
    }

    [Fact]
    public async Task GetVwap_WithEmptyQuotes_ReturnsOkEmptyResult()
    {
        // Arrange
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        var httpContext = new DefaultHttpContext();
        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act — should not throw despite empty collection
        var result = await _controller.GetVwap();

        // Assert — empty input is guarded before First(), yielding an empty 200.
        var okResult = Assert.IsType<OkObjectResult>(result);
        var vwap = Assert.IsAssignableFrom<IEnumerable<VwapResult>>(okResult.Value).ToList();
        Assert.Empty(vwap);
    }

    /// <summary>
    /// Helper to generate sample quote data for tests.
    /// </summary>
    private static List<Quote> GenerateSampleQuotes(int count)
    {
        List<Quote> quotes = new();
        DateTime startDate = DateTime.UtcNow.AddDays(-count);

        for (int i = 0; i < count; i++)
        {
            DateTime date = startDate.AddDays(i);
            decimal basePrice = 100m + (i * 0.5m);

            quotes.Add(new Quote(
                date,
                basePrice,
                basePrice + 2m,
                basePrice - 2m,
                basePrice + 1m,
                1000000 + (i * 10000)));
        }

        return quotes;
    }
}
