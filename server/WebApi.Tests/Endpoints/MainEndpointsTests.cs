using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using WebApi.Controllers;
using Xunit;

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
        var result = _controller.Get();

        // Assert
        Assert.NotNull(result);
        Assert.Contains("functioning", result, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetQuotes_WithValidData_ReturnsOkResult()
    {
        // Arrange
        var sampleQuotes = new[]
        {
            new Quote(DateTime.UtcNow, 100m, 102m, 99m, 101m, 1000000),
            new Quote(DateTime.UtcNow.AddDays(-1), 99m, 101m, 98m, 100m, 900000)
        };

        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        // Setup HttpContext for the controller
        var httpContext = new DefaultHttpContext();
        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act
        var result = await _controller.GetQuotes();

        // Assert
        Assert.IsType<OkObjectResult>(result);
        var okResult = (OkObjectResult)result;
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public void GetIndicatorCatalog_ReturnsOkResultWithMetadata()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        var request = httpContext.Request;
        request.Scheme = "https";
        request.Host = new HostString("localhost:5001");

        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act
        var result = _controller.GetIndicatorCatalog();

        // Assert
        Assert.IsType<OkObjectResult>(result);
        var okResult = (OkObjectResult)result;
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task GetAdl_WithValidQuotes_ReturnsOkResult()
    {
        // Arrange
        var sampleQuotes = GenerateSampleQuotes(50);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        var httpContext = new DefaultHttpContext();
        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act
        var result = await _controller.GetAdl();

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetAdx_WithValidParameters_ReturnsOkResult()
    {
        // Arrange
        var sampleQuotes = GenerateSampleQuotes(50);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        var httpContext = new DefaultHttpContext();
        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act
        var result = await _controller.GetAdx(14);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetRsi_WithValidParameters_ReturnsOkResult()
    {
        // Arrange
        var sampleQuotes = GenerateSampleQuotes(50);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        var httpContext = new DefaultHttpContext();
        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act
        var result = await _controller.GetRsi(14);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetMacd_WithValidParameters_ReturnsOkResult()
    {
        // Arrange
        var sampleQuotes = GenerateSampleQuotes(50);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        var httpContext = new DefaultHttpContext();
        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act
        var result = await _controller.GetMacd(12, 26, 9);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetBollingerBands_WithValidParameters_ReturnsOkResult()
    {
        // Arrange
        var sampleQuotes = GenerateSampleQuotes(50);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        var httpContext = new DefaultHttpContext();
        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act
        var result = await _controller.GetBollingerBands(20, 2.0);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetSma_WithValidParameters_ReturnsOkResult()
    {
        // Arrange
        var sampleQuotes = GenerateSampleQuotes(50);
        _quoteServiceMock
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleQuotes);

        var httpContext = new DefaultHttpContext();
        _controller.ControllerContext = new ControllerContext {
            HttpContext = httpContext
        };

        // Act
        var result = await _controller.GetSma(20);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    /// <summary>
    /// Helper to generate sample quote data for tests.
    /// </summary>
    private static List<Quote> GenerateSampleQuotes(int count)
    {
        var quotes = new List<Quote>();
        var startDate = DateTime.UtcNow.AddDays(-count);

        for (int i = 0; i < count; i++)
        {
            var date = startDate.AddDays(i);
            var basePrice = 100m + i * 0.5m;

            quotes.Add(new Quote(
                date,
                basePrice,
                basePrice + 2m,
                basePrice - 2m,
                basePrice + 1m,
                1000000 + i * 10000));
        }

        return quotes;
    }
}
