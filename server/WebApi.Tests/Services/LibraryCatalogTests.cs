using System.Globalization;
using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using WebApi.Controllers;
using WebApi.Models;
using ApiListing = WebApi.Models.IndicatorListing;

namespace WebApi.Tests.Services;

public class LibraryCatalogTests
{
    private static readonly List<ApiListing> Served = [.. Metadata.IndicatorListing(string.Empty)];

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
    public void WithLibraryParameters_ListingWithoutALibraryCounterpart_Throws()
    {
        ApiListing unknown = new() {
            Name = "Unknown",
            Uiid = "UNKNOWN",
            LegendTemplate = "UNKNOWN",
            Endpoint = "/UNKNOWN/",
            Category = "oscillator",
            ChartType = "oscillator",
            Results = []
        };

        Assert.Throws<InvalidOperationException>(() => LibraryCatalog.WithLibraryParameters(unknown));
    }
}
