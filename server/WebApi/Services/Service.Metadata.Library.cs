using System.Globalization;
using LibraryListing = FacioQuo.Stock.Indicators.IndicatorListing;

namespace WebApi.Services;

/// <summary>
/// Supplies each listing's parameters from the library's own <see cref="Catalog"/>: name,
/// display name, type, bounds, and default. The demo then offers exactly what
/// FacioQuo.Stock.Indicators accepts. <see cref="Metadata"/> keeps only the presentation:
/// names, colors, thresholds, and tooltips.
/// </summary>
public static class LibraryCatalog
{
    /// <summary>
    /// API routes whose path is not the library's catalog id.
    /// </summary>
    internal static readonly Dictionary<string, string> LibraryIdByRoute = new(StringComparer.Ordinal) {
        ["ATR-STOP-CLOSE"] = "ATR-STOP",
        ["ATR-STOP-HL"] = "ATR-STOP",
        ["CHAIKIN"] = "CHAIKIN-OSC",
        ["CHEXIT-LONG"] = "CHEXIT",
        ["CHEXIT-SHORT"] = "CHEXIT",
        ["CORRELATION"] = "CORR",
        ["DYN"] = "DYNAMIC",
        ["HEIKIN-ASHI"] = "HEIKINASHI",
        ["HL2"] = "BARPART",
        ["HLC3"] = "BARPART",
        ["OC2"] = "BARPART",
        ["OHL3"] = "BARPART",
        ["OHLC4"] = "BARPART",
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
    /// Library parameters an API route names differently, keyed by route and library name.
    /// </summary>
    internal static readonly Dictionary<(string Route, string LibraryName), string> ApiParamNames = new() {
        [("STDEV-CH", "stdDeviations")] = "standardDeviations"
    };

    /// <summary>
    /// Numeric library parameters a route does not take, so the library default always applies.
    /// </summary>
    internal static readonly HashSet<(string Route, string LibraryName)> NotServed = [
        ("DYN", "kFactor"),
        ("STO", "smoothPeriods")
    ];

    /// <summary>
    /// Library listings the demo does not chart.
    /// </summary>
    internal static readonly HashSet<string> NotOffered = new(StringComparer.Ordinal) {
        "RENKO",
        "RENKO-ATR"
    };

    /// <summary>
    /// The API's data type for each library type a caller can set from a query string.
    /// </summary>
    private static readonly Dictionary<string, string> ApiDataTypes = new(StringComparer.Ordinal) {
        ["Int32"] = "int",
        ["Double"] = "number",
        ["Decimal"] = "number"
    };

    internal static readonly Dictionary<string, LibraryListing> LibraryListings
        = Catalog.Get(Style.Series).ToDictionary(listing => listing.Uiid, StringComparer.Ordinal);

    /// <summary>
    /// Returns the listing with its parameters built from the library listing its route maps to.
    /// </summary>
    /// <remarks>
    /// Every numeric library parameter is served unless <see cref="NotServed"/> names it. The
    /// rest (enums, price series, dates) are fixed by the route itself, such as a Chandelier
    /// Exit's long or short variant.
    /// </remarks>
    /// <exception cref="InvalidOperationException">
    /// The route has no library listing, or a served parameter has no bounds or default.
    /// </exception>
    public static IndicatorListing WithLibraryParameters(IndicatorListing listing)
    {
        ArgumentNullException.ThrowIfNull(listing);

        string route = RouteOf(listing.Endpoint);
        string libraryId = LibraryIdOf(route);

        if (!LibraryListings.TryGetValue(libraryId, out LibraryListing? source))
        {
            throw new InvalidOperationException(
                $"{listing.Uiid}: no library catalog listing '{libraryId}'.");
        }

        return listing with {
            Parameters = [.. (source.Parameters ?? [])
                .Where(param => ApiDataTypes.ContainsKey(param.DataType)
                    && !NotServed.Contains((route, param.ParameterName)))
                .Select(param => FromLibrary(listing.Uiid, route, param))]
        };
    }

    internal static string LibraryIdOf(string route)
        => LibraryIdByRoute.GetValueOrDefault(route, route);

    /// <summary>
    /// The route segment of an endpoint, absolute or relative: <c>https://host/SMA/</c> → <c>SMA</c>.
    /// </summary>
    internal static string RouteOf(string endpoint)
    {
        string path = endpoint.TrimEnd('/');
        return path[(path.LastIndexOf('/') + 1)..];
    }

    private static IndicatorParamConfig FromLibrary(string uiid, string route, IndicatorParam param)
    {
        if (param.Minimum is not double minimum
            || param.Maximum is not double maximum
            || param.DefaultValue is null)
        {
            throw new InvalidOperationException(
                $"{uiid}.{param.ParameterName}: the library parameter has no bounds or default.");
        }

        return new IndicatorParamConfig {
            DisplayName = param.DisplayName,
            ParamName = ApiParamNames.GetValueOrDefault((route, param.ParameterName), param.ParameterName),
            DataType = ApiDataTypes[param.DataType],
            Minimum = minimum,
            Maximum = maximum,
            DefaultValue = Convert.ToDouble(param.DefaultValue, CultureInfo.InvariantCulture)
        };
    }
}
