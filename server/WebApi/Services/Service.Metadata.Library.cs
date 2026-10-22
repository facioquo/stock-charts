using System.Globalization;
using LibraryListing = FacioQuo.Stock.Indicators.IndicatorListing;

namespace WebApi.Services;

/// <summary>
/// Supplies each catalog parameter's bounds and default from the library's own
/// <see cref="Catalog"/>, so the demo offers exactly what FacioQuo.Stock.Indicators
/// accepts. <see cref="Metadata"/> keeps only the presentation: names, colors,
/// thresholds, and tooltips.
/// </summary>
public static class LibraryCatalog
{
    /// <summary>
    /// API routes whose path is not the library's catalog id.
    /// </summary>
    private static readonly Dictionary<string, string> LibraryIdByRoute = new(StringComparer.Ordinal) {
        ["ATR-STOP-CLOSE"] = "ATR-STOP",
        ["ATR-STOP-HL"] = "ATR-STOP",
        ["CHAIKIN"] = "CHAIKIN-OSC",
        ["CHEXIT-LONG"] = "CHEXIT",
        ["CHEXIT-SHORT"] = "CHEXIT",
        ["CORRELATION"] = "CORR",
        ["DYN"] = "DYNAMIC",
        ["HEIKIN-ASHI"] = "HEIKINASHI",
        ["ROCWB"] = "ROC-WB",
        ["STDEV-CH"] = "STDEV-CHANNELS",
        ["STO"] = "STOCH",
        ["STORSI"] = "STOCH-RSI",
        ["ULTIMATE"] = "UO",
        ["WILLIAMSR"] = "WILLR",
        ["ZIGZAG-CLOSE"] = "ZIGZAG",
        ["ZIGZAG-HIGHLOW"] = "ZIGZAG"
    };

    /// <summary>
    /// Query parameters the API names differently from the library, keyed by route and API name.
    /// </summary>
    private static readonly Dictionary<(string Route, string ParamName), string> LibraryParamNames = new() {
        [("STDEV-CH", "standardDeviations")] = "stdDeviations"
    };

    private static readonly Dictionary<string, LibraryListing> LibraryListings
        = Catalog.Get(Style.Series).ToDictionary(listing => listing.Uiid, StringComparer.Ordinal);

    /// <summary>
    /// Returns the listing with every parameter's bounds and default taken from the library.
    /// </summary>
    /// <exception cref="InvalidOperationException">
    /// A parameter has no counterpart in the library catalog.
    /// </exception>
    public static IndicatorListing ApplyParameterBounds(IndicatorListing listing)
    {
        ArgumentNullException.ThrowIfNull(listing);

        if (listing.Parameters.Count == 0)
        {
            return listing;
        }

        string route = RouteOf(listing.Endpoint);
        string libraryId = LibraryIdByRoute.GetValueOrDefault(route, route);

        if (!LibraryListings.TryGetValue(libraryId, out LibraryListing? source))
        {
            throw new InvalidOperationException(
                $"{listing.Uiid}: no library catalog listing '{libraryId}'.");
        }

        return listing with {
            Parameters = [.. listing.Parameters.Select(param => FromLibrary(listing.Uiid, route, param, source))]
        };
    }

    private static IndicatorParamConfig FromLibrary(
        string uiid, string route, IndicatorParamConfig param, LibraryListing source)
    {
        string libraryName = LibraryParamNames.GetValueOrDefault((route, param.ParamName), param.ParamName);
        IndicatorParam? match = source.Parameters?
            .FirstOrDefault(p => string.Equals(p.ParameterName, libraryName, StringComparison.Ordinal));

        if (match?.Minimum is not double minimum || match.Maximum is not double maximum)
        {
            throw new InvalidOperationException(
                $"{uiid}.{param.ParamName}: no bounded library parameter '{libraryName}' on '{source.Uiid}'.");
        }

        double? defaultValue = match.DefaultValue is null
            ? null
            : Convert.ToDouble(match.DefaultValue, CultureInfo.InvariantCulture);

        return param with {
            Minimum = minimum,
            Maximum = maximum,
            DefaultValue = defaultValue
        };
    }

    /// <summary>
    /// The route segment of an endpoint, absolute or relative: <c>https://host/SMA/</c> → <c>SMA</c>.
    /// </summary>
    private static string RouteOf(string endpoint)
    {
        string path = endpoint.TrimEnd('/');
        return path[(path.LastIndexOf('/') + 1)..];
    }
}
