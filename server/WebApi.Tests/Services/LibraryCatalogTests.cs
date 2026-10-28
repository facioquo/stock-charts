using System.Globalization;
using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using WebApi.Controllers;
using WebApi.Models;
using ApiListing = WebApi.Models.IndicatorListing;
using LibraryListing = FacioQuo.Stock.Indicators.IndicatorListing;

namespace WebApi.Tests.Services;

public class LibraryCatalogTests
{
    private static readonly List<ApiListing> Served = [.. Metadata.IndicatorListing(string.Empty)];

    private static readonly List<ChartListing> Charted = Metadata.ChartListings(string.Empty);

    private static LibraryListing LibraryListingOf(ChartListing chart)
        => LibraryCatalog.LibraryListings[LibraryCatalog.LibraryIdOf(LibraryCatalog.RouteOf(chart.Endpoint))];

    private static readonly HashSet<string> ServedRoutes
        = [.. Served.Select(listing => LibraryCatalog.RouteOf(listing.Endpoint))];

    /// <summary>
    /// Each GET action's query parameters, keyed by route: what the endpoint actually binds.
    /// </summary>
    private static readonly Dictionary<string, ParameterInfo[]> EndpointParameters
        = typeof(Main).GetMethods()
            .SelectMany(method => method.GetCustomAttributes<HttpGetAttribute>()
                .Where(get => get.Template is not null)
                .Select(get => (Route: get.Template!, Method: method)))
            .ToDictionary(
                action => action.Route,
                action => action.Method.GetParameters()
                    .Where(p => p.ParameterType.IsPrimitive || p.ParameterType == typeof(decimal))
                    .ToArray(),
                StringComparer.Ordinal);

    private static IndicatorParam LibraryParam(string route, string apiName)
    {
        string libraryName = LibraryCatalog.ApiParamNames
            .Where(entry => entry.Key.Route == route && entry.Value == apiName)
            .Select(entry => entry.Key.LibraryName)
            .DefaultIfEmpty(apiName)
            .Single();

        return LibraryCatalog.LibraryListings[LibraryCatalog.LibraryIdOf(route)]
            .Parameters!.Single(p => p.ParameterName == libraryName);
    }

    [Fact]
    public void EveryParameter_HasADefaultWithinItsBounds()
    {
        List<string> invalid = [.. Served
            .SelectMany(l => l.Parameters.Select(p => (l.Uiid, Param: p)))
            .Where(x => x.Param.DefaultValue < x.Param.Minimum || x.Param.DefaultValue > x.Param.Maximum)
            .Select(x => $"{x.Uiid}.{x.Param.ParamName}: {x.Param.DefaultValue} not in [{x.Param.Minimum}, {x.Param.Maximum}]")];

        Assert.True(invalid.Count == 0, string.Join('\n', invalid));
    }

    [Fact]
    public void EveryParameter_TakesItsNameBoundsAndDefaultFromTheLibrary()
    {
        List<string> drift = [];

        foreach (ApiListing listing in Served)
        {
            string route = LibraryCatalog.RouteOf(listing.Endpoint);

            foreach (IndicatorParamConfig served in listing.Parameters)
            {
                IndicatorParam library = LibraryParam(route, served.ParamName);
                double libraryDefault = Convert.ToDouble(library.DefaultValue, CultureInfo.InvariantCulture);

                if (served.DisplayName != library.DisplayName
                    || served.Minimum != library.Minimum
                    || served.Maximum != library.Maximum
                    || served.DefaultValue != libraryDefault)
                {
                    drift.Add($"{listing.Uiid}.{served.ParamName}");
                }
            }
        }

        Assert.True(drift.Count == 0, "Served values differ from the library: " + string.Join(", ", drift));
    }

    [Fact]
    public void EveryRoute_ServesExactlyTheParametersItsEndpointAccepts()
    {
        List<string> mismatched = [];

        foreach (ApiListing listing in Served)
        {
            string route = LibraryCatalog.RouteOf(listing.Endpoint);
            Assert.True(EndpointParameters.TryGetValue(route, out ParameterInfo[]? accepted), $"{listing.Uiid}: no GET /{route} action.");

            string served = string.Join(", ", listing.Parameters.Select(p => $"{p.ParamName}:{p.DataType}"));
            string bound = string.Join(", ", accepted.Select(p => $"{p.Name}:{(p.ParameterType == typeof(int) ? "int" : "number")}"));

            if (served != bound)
            {
                mismatched.Add($"{listing.Uiid}: catalog [{served}], endpoint [{bound}]");
            }
        }

        Assert.True(mismatched.Count == 0, string.Join('\n', mismatched));
    }

    [Fact]
    public void EveryLibraryListing_IsChartedOrMarkedNotOffered()
    {
        HashSet<string> charted = [.. ServedRoutes.Select(LibraryCatalog.LibraryIdOf)];

        List<string> unaccounted = [.. LibraryCatalog.LibraryListings.Keys
            .Where(id => !charted.Contains(id) && !LibraryCatalog.NotOffered.Contains(id))];
        List<string> wronglyMarked = [.. LibraryCatalog.NotOffered.Where(charted.Contains)];

        Assert.True(unaccounted.Count == 0, "Library listings the demo neither charts nor marks not offered: " + string.Join(", ", unaccounted));
        Assert.True(wronglyMarked.Count == 0, "Marked not offered but charted: " + string.Join(", ", wronglyMarked));
    }

    [Fact]
    public void EveryMapEntry_NamesAServedRouteAndARealLibraryValue()
    {
        List<string> stale = [];

        stale.AddRange(LibraryCatalog.LibraryIdByRoute
            .Where(alias => !ServedRoutes.Contains(alias.Key) || !LibraryCatalog.LibraryListings.ContainsKey(alias.Value))
            .Select(alias => $"route alias {alias.Key} -> {alias.Value}"));

        stale.AddRange(LibraryCatalog.ApiParamNames.Keys
            .Concat(LibraryCatalog.NotServed)
            .Where(key => !ServedRoutes.Contains(key.Route)
                || LibraryCatalog.LibraryListings[LibraryCatalog.LibraryIdOf(key.Route)]
                    .Parameters?.Any(p => p.ParameterName == key.LibraryName) != true)
            .Select(key => $"parameter {key.Route}.{key.LibraryName}"));

        stale.AddRange(LibraryCatalog.NotOffered
            .Where(id => !LibraryCatalog.LibraryListings.ContainsKey(id))
            .Select(id => $"not offered {id}"));

        Assert.True(stale.Count == 0, "Stale entries: " + string.Join(", ", stale));
    }

    [Fact]
    public void EveryChartValue_DiffersFromTheLibrarysOwn()
    {
        List<string> redundant = [];

        foreach (ChartListing chart in Charted)
        {
            LibraryListing library = LibraryListingOf(chart);
            IndicatorPane? pane = LibraryCatalog.PaneOf(library, chart.Results);

            if (chart.Name == library.Name)
            {
                redundant.Add($"{chart.Uiid} name");
            }

            if (chart.Category == LibraryCatalog.CategoryOf(library))
            {
                redundant.Add($"{chart.Uiid} category");
            }

            if (chart.ChartType is not null && chart.ChartType == LibraryCatalog.ChartTypeOf(library, chart.Results))
            {
                redundant.Add($"{chart.Uiid} chart type");
            }

            if (chart.ChartConfig?.MinimumYAxis is not null && chart.ChartConfig.MinimumYAxis == pane?.Minimum)
            {
                redundant.Add($"{chart.Uiid} axis minimum");
            }

            if (chart.ChartConfig?.MaximumYAxis is not null && chart.ChartConfig.MaximumYAxis == pane?.Maximum)
            {
                redundant.Add($"{chart.Uiid} axis maximum");
            }

            redundant.AddRange(chart.Results
                .Where(result => result.DisplayName is not null
                    && result.DisplayName == LibraryCatalog.ResultOf(library, result.DataName)?.DisplayName)
                .Select(result => $"{chart.Uiid}.{result.DataName} display name"));
        }

        Assert.True(redundant.Count == 0, "Set to what the library already gives, so remove: " + string.Join(", ", redundant));
    }

    [Fact]
    public void EveryThreshold_IsALevelTheLibraryListsForItsPane()
    {
        List<string> drift = [];

        foreach (ChartListing chart in Charted)
        {
            IReadOnlyList<double>? levels = LibraryCatalog.PaneOf(LibraryListingOf(chart), chart.Results)?.Thresholds;
            List<double> drawn = [.. chart.ChartConfig?.Thresholds?.Select(threshold => threshold.Value) ?? []];

            if (levels is not null && !drawn.SequenceEqual(levels))
            {
                drift.Add($"{chart.Uiid}: [{string.Join(", ", drawn)}], library [{string.Join(", ", levels)}]");
            }
        }

        Assert.True(drift.Count == 0, string.Join('\n', drift));
    }

    [Fact]
    public void Build_TakesTheLibrarysNamesCategoryAndPane()
    {
        ApiListing rsi = LibraryCatalog.Build(new ChartListing {
            Uiid = "RSI",
            LegendTemplate = "RSI([P1])",
            Endpoint = "/RSI/",
            Results = [
                new() {
                    TooltipTemplate = "RSI([P1])",
                    DataName = "rsi",
                    LineType = "solid",
                    DefaultColor = ChartColors.StandardBlue
                }
            ]
        });

        Assert.Equal("Relative Strength Index", rsi.Name);
        Assert.Equal("oscillator", rsi.Category);
        Assert.Equal("oscillator", rsi.ChartType);
        Assert.Equal(0, rsi.ChartConfig?.MinimumYAxis);
        Assert.Equal(100, rsi.ChartConfig?.MaximumYAxis);
        Assert.Equal("RSI", Assert.Single(rsi.Results).DisplayName);
    }

    [Fact]
    public void Build_ResultTheLibraryDoesNotList_NeedsADisplayName()
    {
        ChartListing unnamed = new() {
            Uiid = "SMA",
            LegendTemplate = "SMA([P1])",
            Endpoint = "/SMA/",
            ChartType = "overlay",
            Results = [
                new() {
                    TooltipTemplate = "SMA([P1])",
                    DataName = "unknown",
                    LineType = "solid",
                    DefaultColor = ChartColors.StandardBlue
                }
            ]
        };

        Assert.Throws<InvalidOperationException>(() => LibraryCatalog.Build(unnamed));
        Assert.Equal("Unknown", Assert.Single(LibraryCatalog.Build(unnamed with {
            Results = [unnamed.Results.Single() with { DisplayName = "Unknown" }]
        }).Results).DisplayName);
    }

    [Fact]
    public void Build_NoResultTheLibraryLists_NeedsAChartType()
    {
        ChartListing untyped = new() {
            Uiid = "SMA",
            LegendTemplate = "SMA([P1])",
            Endpoint = "/SMA/",
            Results = [
                new() {
                    DisplayName = "Unknown",
                    TooltipTemplate = "SMA([P1])",
                    DataName = "unknown",
                    LineType = "solid",
                    DefaultColor = ChartColors.StandardBlue
                }
            ]
        };

        Assert.Throws<InvalidOperationException>(() => LibraryCatalog.Build(untyped));
        Assert.Equal("overlay", LibraryCatalog.Build(untyped with { ChartType = "overlay" }).ChartType);
    }

    [Theory]
    [InlineData(null, 100d, 14)]
    [InlineData(1d, null, 14)]
    [InlineData(1d, 100d, null)]
    public void FromLibrary_ParameterWithoutBoundsOrDefault_Throws(double? minimum, double? maximum, int? defaultValue)
    {
        IndicatorParam unbounded = new() {
            DisplayName = "Lookback Periods",
            ParameterName = "lookbackPeriods",
            DataType = "Int32",
            Minimum = minimum,
            Maximum = maximum,
            DefaultValue = defaultValue
        };

        Assert.Throws<InvalidOperationException>(() => LibraryCatalog.FromLibrary("SMA", "SMA", unbounded));
    }

    [Fact]
    public void Build_ListingWithoutALibraryCounterpart_Throws()
    {
        ChartListing unknown = new() {
            Uiid = "UNKNOWN",
            LegendTemplate = "UNKNOWN",
            Endpoint = "/UNKNOWN/",
            Results = []
        };

        Assert.Throws<InvalidOperationException>(() => LibraryCatalog.Build(unknown));
    }
}
