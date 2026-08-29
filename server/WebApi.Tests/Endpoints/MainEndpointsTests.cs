using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
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
        _controller = new Main(
            _quoteServiceMock.Object,
            Options.Create(new CacheSettings()),
            Options.Create(new ApiSettings()),
            Mock.Of<IHostEnvironment>(e => e.EnvironmentName == Environments.Development),
            Mock.Of<ILogger<Main>>());
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
        Bar[] sampleQuotes = new[]
        {
            new Bar(DateTime.UtcNow, 100m, 102m, 99m, 101m, 1000000),
            new Bar(DateTime.UtcNow.AddDays(-1), 99m, 101m, 98m, 100m, 900000)
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
        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task GetQuotes_SetsPublicCacheWithVaryOrigin()
    {
        // Arrange
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync([new Bar(DateTime.UtcNow, 100m, 102m, 99m, 101m, 1_000_000)]);

        DefaultHttpContext httpContext = new();
        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act
        await _controller.GetQuotes();

        // Assert — these responses are cached `public` AND carry a per-origin
        // Access-Control-Allow-Origin, so they MUST advertise `Vary: Origin`.
        // Without it a shared/browser cache serves one origin's cached copy (ACAO
        // included) to a sibling same-site origin, breaking CORS for the whole
        // max-age window (regression guard for #517).
        Assert.Contains("Origin", httpContext.Response.Headers.Vary.ToString(), StringComparison.OrdinalIgnoreCase);

        string cacheControl = httpContext.Response.Headers.CacheControl.ToString();
        Assert.Contains("public", cacheControl, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("max-age", cacheControl, StringComparison.OrdinalIgnoreCase);
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
        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public void GetIndicatorCatalog_WithPublicBaseUrlConfigured_UsesConfiguredOriginNotRequestHost()
    {
        // Arrange — behind the edge Worker the container only sees its own
        // internal request host, so a configured PublicBaseUrl must win over
        // whatever host the request arrived on.
        Main controller = new(
            _quoteServiceMock.Object,
            Options.Create(new CacheSettings()),
            Options.Create(new ApiSettings { PublicBaseUrl = "https://charts.stockindicators.dev/" }),
            Mock.Of<IHostEnvironment>(e => e.EnvironmentName == Environments.Development),
            Mock.Of<ILogger<Main>>());

        DefaultHttpContext httpContext = new();
        HttpRequest request = httpContext.Request;
        request.Scheme = "http";
        request.Host = new HostString("internal-container-host:8080");

        controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act
        IActionResult result = controller.GetIndicatorCatalog();

        // Assert
        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        List<Models.IndicatorListing> listings = Assert.IsType<IEnumerable<Models.IndicatorListing>>(okResult.Value, exactMatch: false).ToList();
        Assert.NotEmpty(listings);
        Assert.All(listings, l => Assert.StartsWith("https://charts.stockindicators.dev/", l.Endpoint, StringComparison.Ordinal));
    }

    [Fact]
    public async Task GetAdl_WithValidQuotes_ReturnsOkResult()
    {
        // Arrange
        List<Bar> sampleQuotes = GenerateSampleQuotes(50);
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
        List<Bar> sampleQuotes = GenerateSampleQuotes(50);
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
        List<Bar> sampleQuotes = GenerateSampleQuotes(50);
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
        List<Bar> sampleQuotes = GenerateSampleQuotes(50);
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
        List<Bar> sampleQuotes = GenerateSampleQuotes(50);
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
        List<Bar> sampleQuotes = GenerateSampleQuotes(50);
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
        List<Bar> sampleQuotes = GenerateSampleQuotes(150);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        DefaultHttpContext httpContext = new();
        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act
        IActionResult result = await _controller.GetVwap();

        // Assert — anchor is the first of the last limitLast (120) quotes, so the
        // sliced response carries exactly 120 results, every one with a computed
        // (non-null) VWAP. A bare status-code check would let a regression that
        // returns fewer rows or leaks pre-anchor nulls pass silently.
        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        List<VwapResult> vwap = Assert.IsType<IEnumerable<VwapResult>>(okResult.Value, exactMatch: false).ToList();
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
        List<Bar> sampleQuotes = GenerateSampleQuotes(50);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        DefaultHttpContext httpContext = new();
        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act
        IActionResult result = await _controller.GetVwap();

        // Assert — fewer quotes than the window means the anchor falls on the
        // first quote, so all 50 rows are visible and every VWAP is computed.
        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        List<VwapResult> vwap = Assert.IsType<IEnumerable<VwapResult>>(okResult.Value, exactMatch: false).ToList();
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

        DefaultHttpContext httpContext = new();
        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act — should not throw despite empty collection
        IActionResult result = await _controller.GetVwap();

        // Assert — empty input is guarded before First(), yielding an empty 200.
        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        List<VwapResult> vwap = Assert.IsType<IEnumerable<VwapResult>>(okResult.Value, exactMatch: false).ToList();
        Assert.Empty(vwap);
    }

    [Fact]
    public async Task GetHl2_ComputesMedianPrice_ReturnsOkResult()
    {
        // Arrange — HL2 = (high + low) / 2. With the sample generator
        // (high = base + 2, low = base - 2) the median collapses to base.
        List<Bar> sampleQuotes = GenerateSampleQuotes(150);
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
        List<TimeValue> values = Assert.IsType<IEnumerable<TimeValue>>(okResult.Value, exactMatch: false).ToList();
        Assert.Equal(120, values.Count);
        Assert.All(values.Zip(sampleQuotes.TakeLast(120)), pair =>
            Assert.Equal((double)(pair.Second.High + pair.Second.Low) / 2, pair.First.Value, 6));
    }

    [Fact]
    public async Task GetHlc3_ComputesTypicalPrice_ReturnsOkResult()
    {
        // Arrange — HLC3 = (high + low + close) / 3.
        List<Bar> sampleQuotes = GenerateSampleQuotes(150);
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
        List<TimeValue> values = Assert.IsType<IEnumerable<TimeValue>>(okResult.Value, exactMatch: false).ToList();
        Assert.Equal(120, values.Count);
        Assert.All(values.Zip(sampleQuotes.TakeLast(120)), pair =>
            Assert.Equal((double)(pair.Second.High + pair.Second.Low + pair.Second.Close) / 3, pair.First.Value, 6));
    }

    [Fact]
    public async Task GetOc2_ComputesOpenCloseAverage_ReturnsOkResult()
    {
        // Arrange — OC2 = (open + close) / 2.
        List<Bar> sampleQuotes = GenerateSampleQuotes(150);
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
        List<TimeValue> values = Assert.IsType<IEnumerable<TimeValue>>(okResult.Value, exactMatch: false).ToList();
        Assert.Equal(120, values.Count);
        Assert.All(values.Zip(sampleQuotes.TakeLast(120)), pair =>
            Assert.Equal((double)(pair.Second.Open + pair.Second.Close) / 2, pair.First.Value, 6));
    }

    [Fact]
    public async Task GetOhl3_ComputesOpenHighLowAverage_ReturnsOkResult()
    {
        // Arrange — OHL3 = (open + high + low) / 3.
        List<Bar> sampleQuotes = GenerateSampleQuotes(150);
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
        List<TimeValue> values = Assert.IsType<IEnumerable<TimeValue>>(okResult.Value, exactMatch: false).ToList();
        Assert.Equal(120, values.Count);
        Assert.All(values.Zip(sampleQuotes.TakeLast(120)), pair =>
            Assert.Equal((double)(pair.Second.Open + pair.Second.High + pair.Second.Low) / 3, pair.First.Value, 6));
    }

    [Fact]
    public async Task GetOhlc4_ComputesAveragePrice_ReturnsOkResult()
    {
        // Arrange — OHLC4 = (open + high + low + close) / 4.
        List<Bar> sampleQuotes = GenerateSampleQuotes(150);
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
        List<TimeValue> values = Assert.IsType<IEnumerable<TimeValue>>(okResult.Value, exactMatch: false).ToList();
        Assert.Equal(120, values.Count);
        Assert.All(values.Zip(sampleQuotes.TakeLast(120)), pair =>
            Assert.Equal((double)(pair.Second.Open + pair.Second.High + pair.Second.Low + pair.Second.Close) / 4, pair.First.Value, 6));
    }

    [Fact]
    public async Task GetGator_WithValidQuotes_ReturnsOkResult()
    {
        // Arrange — Gator derives from the Alligator, which needs ~121 periods
        // of warmup, so generate well beyond that.
        List<Bar> sampleQuotes = GenerateSampleQuotes(150);
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
        List<GatorResult> gator = Assert.IsType<IEnumerable<GatorResult>>(okResult.Value, exactMatch: false).ToList();
        Assert.Equal(120, gator.Count);
    }

    [Fact]
    public async Task GetPivotPoints_WithValidQuotes_ReturnsOkResult()
    {
        // Arrange — monthly pivot points need at least two windows of warmup.
        List<Bar> sampleQuotes = GenerateSampleQuotes(150);
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
        List<PivotPointsResult> pivots = Assert.IsType<IEnumerable<PivotPointsResult>>(okResult.Value, exactMatch: false).ToList();
        Assert.Equal(120, pivots.Count);
    }

    [Fact]
    public async Task GetPivots_WithValidParameters_ReturnsOkResult()
    {
        // Arrange
        List<Bar> sampleQuotes = GenerateSampleQuotes(150);
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
        List<PivotsResult> pivots = Assert.IsType<IEnumerable<PivotsResult>>(okResult.Value, exactMatch: false).ToList();
        Assert.Equal(120, pivots.Count);
    }

    [Fact]
    public async Task GetPivots_WithInvalidParameters_ReturnsBadRequest()
    {
        // Arrange
        List<Bar> sampleQuotes = GenerateSampleQuotes(150);
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
        List<Bar> sampleQuotes = GenerateSampleQuotes(150);
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
        List<RollingPivotsResult> pivots = Assert.IsType<IEnumerable<RollingPivotsResult>>(okResult.Value, exactMatch: false).ToList();
        Assert.Equal(120, pivots.Count);
    }

    [Fact]
    public async Task GetHeikinAshi_WithValidQuotes_ReturnsOkResult()
    {
        // Arrange
        List<Bar> sampleQuotes = GenerateSampleQuotes(150);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        _controller.ControllerContext = new ControllerContext {
            HttpContext = new DefaultHttpContext()
        };

        // Act
        IActionResult result = await _controller.GetHeikinAshi();

        // Assert — rows stay 1:1 with the visible quote window (the client's
        // index-based window slicing depends on it), and every row carries the
        // full OHLC set the candle renderer reads.
        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        List<HeikinAshiResult> ha = Assert.IsType<IEnumerable<HeikinAshiResult>>(okResult.Value, exactMatch: false).ToList();
        Assert.Equal(120, ha.Count);
        Assert.All(ha, r => {
            Assert.NotEqual(default, r.Open);
            Assert.NotEqual(default, r.High);
            Assert.NotEqual(default, r.Low);
            Assert.NotEqual(default, r.Close);
        });
    }

    [Fact]
    public void HeikinAshiListing_RendersAsCandleOverlay()
    {
        // The candle line type reads open/high/low/close from each row. The
        // overlay chart type puts the transform on the price chart, where the
        // client hides the raw price candles while it is displayed — the
        // transform replaces them rather than coexisting (#498).
        Models.IndicatorListing listing = Metadata
            .IndicatorListing("https://localhost")
            .Single(l => l.Uiid == "HEIKIN-ASHI");

        Assert.Equal("overlay", listing.ChartType);
        Models.IndicatorResultConfig result = Assert.Single(listing.Results);
        Assert.Equal("candle", result.LineType);
        Assert.Equal("close", result.DataName);
    }

    [Fact]
    public async Task GetSmaAnalysis_WithValidParameters_ReturnsOkResult()
    {
        // Arrange
        List<Bar> sampleQuotes = GenerateSampleQuotes(150);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        _controller.ControllerContext = new ControllerContext {
            HttpContext = new DefaultHttpContext()
        };

        // Act
        IActionResult result = await _controller.GetSmaAnalysis(14);

        // Assert — the response carries all four metrics (sma, mad, mse, mape)
        // for the visible window; the catalog splits them into per-metric
        // listings client-side, so the endpoint itself stays whole.
        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        List<SmaAnalysisResult> analysis = Assert.IsType<IEnumerable<SmaAnalysisResult>>(okResult.Value, exactMatch: false).ToList();
        Assert.Equal(120, analysis.Count);
        Assert.All(analysis, r => {
            Assert.NotNull(r.Mad);
            Assert.NotNull(r.Mse);
            Assert.NotNull(r.Mape);
        });
    }

    [Fact]
    public async Task GetSmaAnalysis_WithInvalidParameters_ReturnsBadRequest()
    {
        // Arrange
        List<Bar> sampleQuotes = GenerateSampleQuotes(150);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        _controller.ControllerContext = new ControllerContext {
            HttpContext = new DefaultHttpContext()
        };

        // Act — lookbackPeriods below the library minimum surfaces as 400 via
        // the Get<T> helper, not a 500.
        IActionResult result = await _controller.GetSmaAnalysis(0);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Theory]
    [InlineData("SMA-MAD", "mad")]
    [InlineData("SMA-MAPE", "mape")]
    [InlineData("SMA-MSE", "mse")]
    public void SmaAnalysisListings_ExposeOneMetricEach(string uiid, string dataName)
    {
        // The metrics have incompatible units (dollars, fraction, dollars²), so
        // each listing must chart exactly one metric on its own pane (#475). A
        // regression that recombines them would revive the unreadable shared
        // y-axis this split exists to prevent.
        Models.IndicatorListing listing = Metadata
            .IndicatorListing("https://localhost")
            .Single(l => l.Uiid == uiid);

        Assert.Equal("oscillator", listing.ChartType);
        Assert.EndsWith("/SMA-ANALYSIS/", listing.Endpoint, StringComparison.Ordinal);
        Models.IndicatorResultConfig result = Assert.Single(listing.Results);
        Assert.Equal(dataName, result.DataName);
    }

    [Fact]
    public void PivotPointsListing_MarksAllLevelsSegmented()
    {
        // monthly Pivot Points are piecewise-constant level lines: the client
        // renders one horizontal segment per month, so every result opts in.
        Models.IndicatorListing listing = Metadata
            .IndicatorListing("https://localhost")
            .Single(l => l.Uiid == "PIVOT-POINTS");

        // assert the count first so Assert.All cannot pass vacuously on an
        // empty result set (7 levels: R3-R1, PP, S1-S3).
        Assert.Equal(7, listing.Results.Count);
        Assert.All(listing.Results, r => {
            Assert.True(r.Segmented);
            Assert.Equal("step", r.SegmentMode);
        });
    }

    [Fact]
    public void RollingPivotsListing_LeavesLevelsContinuous()
    {
        // rolling pivots recompute every bar (no flat windows), so they render
        // as ordinary continuous lines and must not be segmented.
        Models.IndicatorListing listing = Metadata
            .IndicatorListing("https://localhost")
            .Single(l => l.Uiid == "ROLLING-PIVOTS");

        // assert the count first so Assert.All cannot pass vacuously on an
        // empty result set (7 levels: R3-R1, PP, S1-S3).
        Assert.Equal(7, listing.Results.Count);
        Assert.All(listing.Results, r => Assert.False(r.Segmented));
    }

    [Fact]
    public void StandardDeviationChannelsListing_MarksAllResultsSlopeSegmented()
    {
        Models.IndicatorListing listing = Metadata
            .IndicatorListing("https://localhost")
            .Single(l => l.Uiid == "STDEV-CH");

        // upper, centerline, lower
        Assert.Equal(3, listing.Results.Count);
        Assert.All(listing.Results, r => {
            Assert.True(r.Segmented);
            Assert.Equal("slope", r.SegmentMode);
        });
    }

    // Benchmark-comparison endpoints (BETA, CORRELATION, PRS) read a second
    // series for the market benchmark. These tests pin that behaviour, because
    // when the benchmark resolves to the same bars as the evaluated security
    // the maths still succeeds — it just returns a degenerate constant, which
    // no status code or exception reveals.

    [Theory]
    [InlineData("CORRELATION")]
    [InlineData("PRS")]
    [InlineData("BETA")]
    public async Task BenchmarkIndicators_RequestTheBenchmarkSeries(string indicator)
    {
        // Arrange — both series share one start date; the indicators require
        // timestamp-aligned inputs.
        SetupBenchmarkQuotes(
            GenerateSampleQuotes(60, BenchmarkStart),
            GenerateSampleQuotes(60, BenchmarkStart));

        // Act
        IActionResult result = indicator switch {
            "CORRELATION" => await _controller.GetCorrelation(20),
            "PRS" => await _controller.GetPrs(),
            _ => await _controller.GetBeta(20, BetaType.Standard)
        };

        // Assert — the benchmark series is fetched by symbol, not inferred from
        // the default feed.
        Assert.IsType<OkObjectResult>(result);
        _quoteServiceMock.Verify(
            q => q.Get("SPY", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task GetCorrelation_WithDistinctBenchmark_DoesNotReturnPerfectCorrelation()
    {
        // Arrange — two genuinely different price paths. Correlating a series
        // with itself yields exactly 1.0 at every point; that is what a
        // symbol-agnostic benchmark silently produces, so this asserts the two
        // series stay distinct all the way into the calculation.
        SetupBenchmarkQuotes(
            GenerateSampleQuotes(60, BenchmarkStart),
            GenerateDivergentQuotes(60, BenchmarkStart));

        // Act
        IActionResult result = await _controller.GetCorrelation(20);

        // Assert
        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        IEnumerable<CorrResult> results
            = Assert.IsType<IEnumerable<CorrResult>>(okResult.Value, exactMatch: false);

        List<double> correlations = results
            .Where(r => r.Correlation is not null)
            .Select(r => r.Correlation!.Value)
            .ToList();

        Assert.NotEmpty(correlations);
        Assert.All(correlations, c => Assert.InRange(c, -1d, 1d));
        Assert.Contains(correlations, c => Math.Abs(c - 1d) > 1e-9);
    }

    // Wires the default feed and the "SPY" benchmark feed to separate datasets.
    private void SetupBenchmarkQuotes(IReadOnlyList<Bar> evaluated, IReadOnlyList<Bar> benchmark)
    {
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(evaluated);

        _quoteServiceMock
            .Setup(q => q.Get("SPY", It.IsAny<CancellationToken>()))
            .ReturnsAsync(benchmark);

        _controller.ControllerContext = new ControllerContext {
            HttpContext = new DefaultHttpContext()
        };
    }

    // Fixed so the evaluated and benchmark series carry identical timestamps;
    // the comparison indicators reject misaligned inputs.
    private static readonly DateTime BenchmarkStart = new(2024, 1, 2, 0, 0, 0, DateTimeKind.Utc);

    // A price path that rises and falls against GenerateSampleQuotes' steady
    // climb, so the two series are not perfectly correlated.
    private static List<Bar> GenerateDivergentQuotes(int count, DateTime startDate)
    {
        List<Bar> quotes = new(count);

        for (int i = 0; i < count; i++)
        {
            decimal basePrice = 100m + ((decimal)Math.Sin(i / 3d) * 8m);

            quotes.Add(new Bar(
                startDate.AddDays(i),
                basePrice,
                basePrice + 2m,
                basePrice - 2m,
                basePrice + 1m,
                1000000 + (i * 10000)));
        }

        return quotes;
    }

    /// <summary>
    /// Helper to generate sample quote data for tests.
    /// </summary>
    private static List<Bar> GenerateSampleQuotes(int count)
        => GenerateSampleQuotes(count, DateTime.UtcNow.AddDays(-count));

    private static List<Bar> GenerateSampleQuotes(int count, DateTime startDate)
    {
        List<Bar> quotes = new();

        for (int i = 0; i < count; i++)
        {
            DateTime date = startDate.AddDays(i);
            decimal basePrice = 100m + (i * 0.5m);

            quotes.Add(new Bar(
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
