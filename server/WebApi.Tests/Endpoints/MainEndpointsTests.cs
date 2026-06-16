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

    [Fact]
    public async Task GetHl2_ComputesMedianPrice_ReturnsOkResult()
    {
        // Arrange — HL2 = (high + low) / 2. With the sample generator
        // (high = base + 2, low = base - 2) the median collapses to base.
        List<Quote> sampleQuotes = GenerateSampleQuotes(150);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        _controller.ControllerContext = new ControllerContext {
            HttpContext = new DefaultHttpContext()
        };

        // Act
        IActionResult result = await _controller.GetHl2();

        // Assert — the visible window carries the limitLast slice, every value
        // computed from the expected (high + low) / 2 formula.
        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        List<TimeValue> values = Assert.IsAssignableFrom<IEnumerable<TimeValue>>(okResult.Value).ToList();
        Assert.Equal(120, values.Count);
        Assert.All(values.Zip(sampleQuotes.TakeLast(120)), pair =>
            Assert.Equal((double)(pair.Second.High + pair.Second.Low) / 2, pair.First.Value, 6));
    }

    [Fact]
    public async Task GetHlc3_ComputesTypicalPrice_ReturnsOkResult()
    {
        // Arrange — HLC3 = (high + low + close) / 3.
        List<Quote> sampleQuotes = GenerateSampleQuotes(150);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        _controller.ControllerContext = new ControllerContext {
            HttpContext = new DefaultHttpContext()
        };

        // Act
        IActionResult result = await _controller.GetHlc3();

        // Assert
        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        List<TimeValue> values = Assert.IsAssignableFrom<IEnumerable<TimeValue>>(okResult.Value).ToList();
        Assert.Equal(120, values.Count);
        Assert.All(values.Zip(sampleQuotes.TakeLast(120)), pair =>
            Assert.Equal((double)(pair.Second.High + pair.Second.Low + pair.Second.Close) / 3, pair.First.Value, 6));
    }

    [Fact]
    public async Task GetOc2_ComputesOpenCloseAverage_ReturnsOkResult()
    {
        // Arrange — OC2 = (open + close) / 2.
        List<Quote> sampleQuotes = GenerateSampleQuotes(150);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        _controller.ControllerContext = new ControllerContext {
            HttpContext = new DefaultHttpContext()
        };

        // Act
        IActionResult result = await _controller.GetOc2();

        // Assert
        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        List<TimeValue> values = Assert.IsAssignableFrom<IEnumerable<TimeValue>>(okResult.Value).ToList();
        Assert.Equal(120, values.Count);
        Assert.All(values.Zip(sampleQuotes.TakeLast(120)), pair =>
            Assert.Equal((double)(pair.Second.Open + pair.Second.Close) / 2, pair.First.Value, 6));
    }

    [Fact]
    public async Task GetOhl3_ComputesOpenHighLowAverage_ReturnsOkResult()
    {
        // Arrange — OHL3 = (open + high + low) / 3.
        List<Quote> sampleQuotes = GenerateSampleQuotes(150);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        _controller.ControllerContext = new ControllerContext {
            HttpContext = new DefaultHttpContext()
        };

        // Act
        IActionResult result = await _controller.GetOhl3();

        // Assert
        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        List<TimeValue> values = Assert.IsAssignableFrom<IEnumerable<TimeValue>>(okResult.Value).ToList();
        Assert.Equal(120, values.Count);
        Assert.All(values.Zip(sampleQuotes.TakeLast(120)), pair =>
            Assert.Equal((double)(pair.Second.Open + pair.Second.High + pair.Second.Low) / 3, pair.First.Value, 6));
    }

    [Fact]
    public async Task GetOhlc4_ComputesAveragePrice_ReturnsOkResult()
    {
        // Arrange — OHLC4 = (open + high + low + close) / 4.
        List<Quote> sampleQuotes = GenerateSampleQuotes(150);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        _controller.ControllerContext = new ControllerContext {
            HttpContext = new DefaultHttpContext()
        };

        // Act
        IActionResult result = await _controller.GetOhlc4();

        // Assert
        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        List<TimeValue> values = Assert.IsAssignableFrom<IEnumerable<TimeValue>>(okResult.Value).ToList();
        Assert.Equal(120, values.Count);
        Assert.All(values.Zip(sampleQuotes.TakeLast(120)), pair =>
            Assert.Equal((double)(pair.Second.Open + pair.Second.High + pair.Second.Low + pair.Second.Close) / 4, pair.First.Value, 6));
    }

    [Fact]
    public async Task GetGator_WithValidQuotes_ReturnsOkResult()
    {
        // Arrange — Gator derives from the Alligator, which needs ~121 periods
        // of warmup, so generate well beyond that.
        List<Quote> sampleQuotes = GenerateSampleQuotes(150);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        _controller.ControllerContext = new ControllerContext {
            HttpContext = new DefaultHttpContext()
        };

        // Act
        IActionResult result = await _controller.GetGator();

        // Assert — the catalog exposes upper/lower histograms; confirm the
        // endpoint returns the GatorResult series for the visible window.
        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        List<GatorResult> gator = Assert.IsAssignableFrom<IEnumerable<GatorResult>>(okResult.Value).ToList();
        Assert.Equal(120, gator.Count);
    }

    [Fact]
    public async Task GetPivotPoints_WithValidQuotes_ReturnsOkResult()
    {
        // Arrange — monthly pivot points need at least two windows of warmup.
        List<Quote> sampleQuotes = GenerateSampleQuotes(150);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        _controller.ControllerContext = new ControllerContext {
            HttpContext = new DefaultHttpContext()
        };

        // Act
        IActionResult result = await _controller.GetPivotPoints();

        // Assert
        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        List<PivotPointsResult> pivots = Assert.IsAssignableFrom<IEnumerable<PivotPointsResult>>(okResult.Value).ToList();
        Assert.Equal(120, pivots.Count);
    }

    [Fact]
    public async Task GetPivots_WithValidParameters_ReturnsOkResult()
    {
        // Arrange
        List<Quote> sampleQuotes = GenerateSampleQuotes(150);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        _controller.ControllerContext = new ControllerContext {
            HttpContext = new DefaultHttpContext()
        };

        // Act — leftSpan, rightSpan, maxTrendPeriods
        IActionResult result = await _controller.GetPivots(2, 2, 20);

        // Assert
        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        List<PivotsResult> pivots = Assert.IsAssignableFrom<IEnumerable<PivotsResult>>(okResult.Value).ToList();
        Assert.Equal(120, pivots.Count);
    }

    [Fact]
    public async Task GetPivots_WithInvalidParameters_ReturnsBadRequest()
    {
        // Arrange
        List<Quote> sampleQuotes = GenerateSampleQuotes(150);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        _controller.ControllerContext = new ControllerContext {
            HttpContext = new DefaultHttpContext()
        };

        // Act — maxTrendPeriods must exceed leftSpan; the library throws and the
        // Get<T> helper surfaces it as a 400 rather than a 500.
        IActionResult result = await _controller.GetPivots(2, 2, 1);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task GetRollingPivots_WithValidParameters_ReturnsOkResult()
    {
        // Arrange
        List<Quote> sampleQuotes = GenerateSampleQuotes(150);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        _controller.ControllerContext = new ControllerContext {
            HttpContext = new DefaultHttpContext()
        };

        // Act — windowPeriods, offsetPeriods
        IActionResult result = await _controller.GetRollingPivots(11, 9);

        // Assert
        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        List<RollingPivotsResult> pivots = Assert.IsAssignableFrom<IEnumerable<RollingPivotsResult>>(okResult.Value).ToList();
        Assert.Equal(120, pivots.Count);
    }

    [Fact]
    public void PivotPointsListing_MarksAllLevelsSegmented()
    {
        // monthly Pivot Points are piecewise-constant level lines: the client
        // renders one horizontal segment per month, so every result opts in.
        var listing = Metadata
            .IndicatorListing("https://localhost")
            .Single(l => l.Uiid == "PIVOT-POINTS");

        Assert.All(listing.Results, r => Assert.True(r.Segmented));
    }

    [Fact]
    public void RollingPivotsListing_LeavesLevelsContinuous()
    {
        // rolling pivots recompute every bar (no flat windows), so they render
        // as ordinary continuous lines and must not be segmented.
        var listing = Metadata
            .IndicatorListing("https://localhost")
            .Single(l => l.Uiid == "ROLLING-PIVOTS");

        Assert.All(listing.Results, r => Assert.False(r.Segmented));
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
