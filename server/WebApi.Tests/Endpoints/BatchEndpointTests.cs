using System.Collections;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using WebApi.Controllers;
using WebApi.Services;

namespace WebApi.Tests.Endpoints;

/// <summary>
/// Tests for <c>GET /indicators/batch</c>: every selection's rows in one call.
/// </summary>
public class BatchEndpointTests
{
    private readonly Main _controller;
    private readonly Mock<IQuoteService> _quoteService = new();

    public BatchEndpointTests()
    {
        Mock<IQuoteService> quoteService = _quoteService;
        quoteService
            .Setup(q => q.Get(It.IsAny<CancellationToken>()))
            .ReturnsAsync(Quotes(120));

        _controller = new Main(
            quoteService.Object,
            Options.Create(new CacheSettings()),
            Options.Create(new ApiSettings()),
            Mock.Of<IHostEnvironment>(e => e.EnvironmentName == Environments.Development),
            Mock.Of<ILogger<Main>>()) {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
    }

    /// <summary>Runs the batch with each value as a repeated <c>s</c> query key, as the wire carries it.</summary>
    private Task<IActionResult> Batch(string[]? selections)
    {
        _controller.Request.QueryString = QueryString.Create(
            (selections ?? []).Select(value => new KeyValuePair<string, string?>("s", value)));
        return _controller.GetIndicatorBatch();
    }

    private static List<Bar> Quotes(int count)
        => [.. Enumerable.Range(0, count)
            .Select(i => new Bar(
                new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc).AddDays(i),
                100m + i, 102m + i, 99m + i, 101m + i, 1_000_000 + i))];

    private static List<object> Items(object? value)
        => [.. ((IEnumerable)value!).Cast<object>()];

    private static object? Property(object item, string name)
        => item.GetType().GetProperty(name)!.GetValue(item);

    private static List<object?> Statuses(IEnumerable<object> items)
        => [.. items.Select(item => Property(item, "Status"))];

    [Fact]
    public async Task Batch_ReturnsEverySelectionInRequestOrder()
    {
        IActionResult result = await Batch(
            ["ADX?lookbackPeriods=14", "BB?lookbackPeriods=20&standardDeviations=2", "ADL"]);

        OkObjectResult ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal([200, 200, 200], Statuses(Items(ok.Value)));
    }

    [Fact]
    public async Task Batch_RowsMatchTheSingleIndicatorCall()
    {
        OkObjectResult single = Assert.IsType<OkObjectResult>(await _controller.GetAdx(14));
        OkObjectResult batch = Assert.IsType<OkObjectResult>(
            await Batch(["ADX?lookbackPeriods=14"]));

        object data = Property(Items(batch.Value).Single(), "Data")!;

        Assert.Equal(JsonSerializer.Serialize(single.Value), JsonSerializer.Serialize(data));
    }

    [Fact]
    public async Task Batch_MatchesRouteNamesAndParametersCaseInsensitively()
    {
        IActionResult result = await Batch(["adx?LOOKBACKPERIODS=14"]);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Batch_SetsSharedCacheHeadersWhenEverySelectionSucceeds()
    {
        await Batch(["ADX?lookbackPeriods=14", "ADL"]);

        Assert.Contains("public", _controller.Response.Headers.CacheControl.ToString());
        Assert.Equal("Origin", _controller.Response.Headers.Vary.ToString());
    }

    [Fact]
    public async Task Batch_ReportsEachFailureAndReturnsMultiStatusWithoutCaching()
    {
        IActionResult result = await Batch(
            ["ADX?lookbackPeriods=14", "NOPE", "ADX", "ADX?lookbackPeriods=abc", "ADX?lookbackPeriods=0"]);

        ObjectResult multi = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status207MultiStatus, multi.StatusCode);
        Assert.Equal([200, 404, 400, 400, 400], Statuses(Items(multi.Value)));
        Assert.False(_controller.Response.Headers.ContainsKey("Cache-Control"));
    }

    [Fact]
    public async Task Batch_RejectsAnEmptyRequest()
    {
        Assert.IsType<BadRequestObjectResult>(await Batch(null));
        Assert.IsType<BadRequestObjectResult>(await Batch([]));
    }

    [Fact]
    public async Task Batch_RejectsMoreSelectionsThanTheCap()
    {
        string[] tooMany = [.. Enumerable.Repeat("ADL", 21)];

        Assert.IsType<BadRequestObjectResult>(await Batch(tooMany));
        Assert.IsType<OkObjectResult>(await Batch([.. tooMany.Take(20)]));
    }

    [Fact]
    public async Task Batch_DoesNotRunNonIndicatorRoutes()
    {
        IActionResult result = await Batch(
            ["quotes", "indicators", "indicators/batch"]);

        ObjectResult multi = Assert.IsType<ObjectResult>(result);
        Assert.Equal([404, 404, 404], Statuses(Items(multi.Value)));
    }

    [Fact]
    public async Task Batch_BindsEnumParametersByName()
    {
        _quoteService
            .Setup(q => q.Get(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Quotes(120));

        IActionResult result = await Batch(
            ["BETA?lookbackPeriods=14&type=Up", "BETA?lookbackPeriods=14&type=Sideways", "BETA?lookbackPeriods=14&type=up"]);

        ObjectResult multi = Assert.IsType<ObjectResult>(result);
        Assert.Equal([200, 400, 200], Statuses(Items(multi.Value)));
    }

    [Fact]
    public async Task Batch_AnItemThatThrowsDoesNotDiscardItsNeighbours()
    {
        // A jaw offset of int.MaxValue overflows inside the indicator.
        IActionResult result = await Batch(
            ["ADL", "ALLIGATOR?jawPeriods=13&jawOffset=2147483647&teethPeriods=8&teethOffset=5&lipsPeriods=5&lipsOffset=3", "ADX?lookbackPeriods=14"]);

        ObjectResult multi = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status207MultiStatus, multi.StatusCode);
        Assert.Equal([200, 500, 200], Statuses(Items(multi.Value)));
    }

    [Fact]
    public async Task Batch_BindsARepeatedParameterToItsFirstValue()
    {
        OkObjectResult single = Assert.IsType<OkObjectResult>(await _controller.GetAdx(14));
        OkObjectResult batch = Assert.IsType<OkObjectResult>(
            await Batch(["ADX?lookbackPeriods=14&lookbackPeriods=20"]));

        object data = Property(Items(batch.Value).Single(), "Data")!;

        Assert.Equal(JsonSerializer.Serialize(single.Value), JsonSerializer.Serialize(data));
    }

    [Fact]
    public async Task Batch_BindsAMissingParameterToItsDefaultLikeASingleCall()
    {
        BadRequestObjectResult single = Assert.IsType<BadRequestObjectResult>(await _controller.GetAdx(0));
        IActionResult result = await Batch(["ADX"]);

        ObjectResult multi = Assert.IsType<ObjectResult>(result);
        Assert.Equal([single.StatusCode], Statuses(Items(multi.Value)));
    }

    [Fact]
    public async Task Batch_ComputesIdenticalSelectionsOnceAndAnswersEveryPosition()
    {
        OkObjectResult ok = Assert.IsType<OkObjectResult>(await Batch(
            ["ADX?lookbackPeriods=14", "adx?LOOKBACKPERIODS=14", "ADL", "ADX?lookbackPeriods=14"]));

        List<object> items = Items(ok.Value);
        Assert.Equal(4, items.Count);
        string rows(int i) => JsonSerializer.Serialize(Property(items[i], "Data"));
        Assert.Equal(rows(0), rows(1));
        Assert.Equal(rows(0), rows(3));
        Assert.NotEqual(rows(0), rows(2));
        _quoteService.Verify(q => q.Get(It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task Batch_SerializesTheDocumentedWireShape()
    {
        JsonSerializerOptions web = new(JsonSerializerDefaults.Web);
        ObjectResult multi = Assert.IsType<ObjectResult>(await Batch(
            ["ADL", "ALLIGATOR?jawPeriods=13&jawOffset=2147483647&teethPeriods=8&teethOffset=5&lipsPeriods=5&lipsOffset=3", "NOPE"]));

        using JsonDocument json = JsonDocument.Parse(JsonSerializer.Serialize(multi.Value, web));
        JsonElement[] items = [.. json.RootElement.EnumerateArray()];

        Assert.Equal(200, items[0].GetProperty("status").GetInt32());
        Assert.Equal(JsonValueKind.Array, items[0].GetProperty("data").ValueKind);
        Assert.False(items[0].TryGetProperty("error", out _));

        // A 500 names no exception detail.
        Assert.Equal(500, items[1].GetProperty("status").GetInt32());
        Assert.Equal("The indicator could not be calculated.", items[1].GetProperty("error").GetString());
        Assert.False(items[1].TryGetProperty("data", out _));

        Assert.Equal(404, items[2].GetProperty("status").GetInt32());
    }

    [Fact]
    public async Task Batch_IgnoresIndexedSelectionKeys()
    {
        _controller.Request.QueryString = new QueryString("?s[0]=ADL&s[1]=ADX%3FlookbackPeriods%3D14");

        Assert.IsType<BadRequestObjectResult>(await _controller.GetIndicatorBatch());
    }

    [Fact]
    public async Task Batch_ReadsTheSelectionKeyCaseInsensitively()
    {
        _controller.Request.QueryString = new QueryString("?S=ADL&s=ADL");

        OkObjectResult ok = Assert.IsType<OkObjectResult>(await _controller.GetIndicatorBatch());
        Assert.Equal(2, Items(ok.Value).Count);
    }

    [Fact]
    public void Batch_RunsExactlyTheCatalogsIndicatorRoutes()
    {
        string[] advertised = [.. Metadata.IndicatorListing(string.Empty)
            .Select(listing => listing.Endpoint.Trim('/'))
            .Distinct(StringComparer.OrdinalIgnoreCase)];

        string[] actions = [.. typeof(Main).GetMethods()
            .Where(m => m.DeclaringType == typeof(Main) && m.ReturnType == typeof(Task<IActionResult>))
            .Select(m => m.GetCustomAttributes(typeof(HttpGetAttribute), false).Cast<HttpGetAttribute>().SingleOrDefault()?.Template)
            .OfType<string>()
            .Where(route => route is not ("" or "quotes" or "indicators" or "indicators/batch"))];

        Assert.Empty(advertised.Except(actions, StringComparer.OrdinalIgnoreCase));
        Assert.Empty(actions.Except(advertised, StringComparer.OrdinalIgnoreCase));
    }

    [Fact]
    public void Batch_CapMatchesTheSharedContract()
    {
        using JsonDocument contract = JsonDocument.Parse(
            File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "batch.contract.json")));

        Assert.Equal(Main.MaxBatchSelections, contract.RootElement.GetProperty("maxSelections").GetInt32());
    }
}
