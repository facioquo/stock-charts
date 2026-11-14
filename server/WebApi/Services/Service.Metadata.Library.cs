using System.Globalization;
using System.Text.Json;
using LibraryListing = FacioQuo.Stock.Indicators.IndicatorListing;

namespace WebApi.Services;

/// <summary>
/// Builds each listing the API serves from the library's own <see cref="Catalog"/>, extended
/// with how the demo charts it. The library supplies the name, category, result display names,
/// chart panes, and every parameter (name, display name, type, bounds, default), so the demo
/// offers exactly what FacioQuo.Stock.Indicators accepts. <see cref="Metadata"/> keeps only the
/// presentation: legend and tooltip templates, colors, line styles, and thresholds.
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
    /// Builds the listing the API serves from the library listing the chart's route maps to.
    /// </summary>
    /// <remarks>
    /// The name, category, and result display names are the library's unless the chart sets its
    /// own. The chart type follows the library's chart panes, and an axis bound the chart leaves
    /// unset comes from the library's pane. Every numeric library parameter is served unless
    /// <see cref="NotServed"/> names it. The rest (enums, price series, dates) are fixed by the
    /// route itself, such as a Chandelier Exit's long or short variant.
    /// </remarks>
    /// <exception cref="InvalidOperationException">
    /// The route has no library listing, a served parameter has no bounds or default, a result the
    /// library does not list has no display name, or the chart type is unset and no result is one
    /// the library lists.
    /// </exception>
    public static IndicatorListing Build(ChartListing chart)
    {
        ArgumentNullException.ThrowIfNull(chart);

        string route = RouteOf(chart.Endpoint);
        string libraryId = LibraryIdOf(route);

        if (!LibraryListings.TryGetValue(libraryId, out LibraryListing? source))
        {
            throw new InvalidOperationException(
                $"{chart.Uiid}: no library catalog listing '{libraryId}'.");
        }

        IndicatorPane? pane = PaneOf(source, chart.Results);

        return new IndicatorListing {
            Name = chart.Name ?? source.Name,
            Uiid = chart.Uiid,
            LegendTemplate = chart.LegendTemplate,
            Endpoint = chart.Endpoint,
            Category = chart.Category ?? CategoryOf(source),
            ChartType = chart.ChartType ?? ChartTypeOf(source, chart.Results)
                ?? throw new InvalidOperationException(
                    $"{chart.Uiid}: no result is one the library lists, so set its chart type."),
            Order = chart.Order,
            ChartConfig = chart.ChartConfig is null && pane?.Minimum is null && pane?.Maximum is null
                ? null
                : new ChartConfig {
                    MinimumYAxis = chart.ChartConfig?.MinimumYAxis ?? pane?.Minimum,
                    MaximumYAxis = chart.ChartConfig?.MaximumYAxis ?? pane?.Maximum,
                    Thresholds = chart.ChartConfig?.Thresholds
                },
            Parameters = [.. (source.Parameters ?? [])
                .Where(param => ApiDataTypes.ContainsKey(param.DataType)
                    && !NotServed.Contains((route, param.ParameterName)))
                .Select(param => FromLibrary(chart.Uiid, route, param))],
            Results = [.. chart.Results.Select(result => new IndicatorResultConfig {
                DisplayName = result.DisplayName
                    ?? ResultOf(source, result.DataName)?.DisplayName
                    ?? throw new InvalidOperationException(
                        $"{chart.Uiid}.{result.DataName}: the library lists no such result, so set its display name."),
                TooltipTemplate = result.TooltipTemplate,
                DataName = result.DataName,
                DataType = "number",
                LineType = result.LineType,
                Segmented = result.Segmented,
                SegmentMode = result.SegmentMode,
                Stack = result.Stack,
                LineWidth = result.LineWidth,
                DefaultColor = result.DefaultColor,
                Fill = result.Fill
            })]
        };
    }

    internal static string LibraryIdOf(string route)
        => LibraryIdByRoute.GetValueOrDefault(route, route);

    /// <summary>
    /// The library's category as the API names it: <c>VolumeBased</c> → <c>volume-based</c>.
    /// </summary>
    internal static string CategoryOf(LibraryListing source)
        => JsonNamingPolicy.KebabCaseLower.ConvertName(source.Category.ToString());

    /// <summary>
    /// The library result a chart result draws, matched on its data name as the API serializes it.
    /// </summary>
    internal static IndicatorResult? ResultOf(LibraryListing source, string dataName)
        => source.Results.FirstOrDefault(
            result => JsonNamingPolicy.CamelCase.ConvertName(result.DataName) == dataName);

    /// <summary>
    /// <c>overlay</c> when every charted result the library lists draws on price, otherwise
    /// <c>oscillator</c>; <c>null</c> when the library lists none of them.
    /// </summary>
    internal static string? ChartTypeOf(LibraryListing source, IEnumerable<ChartResult> results)
    {
        List<string> panes = [.. results
            .Select(result => ResultOf(source, result.DataName)?.ChartPane)
            .OfType<string>()];

        return panes.Count == 0 ? null
            : panes.TrueForAll(pane => pane == IndicatorResult.PricePane) ? "overlay"
            : "oscillator";
    }

    /// <summary>
    /// The library's description of the one pane besides price that the chart's results draw in,
    /// or <c>null</c> when the library does not list it.
    /// </summary>
    internal static IndicatorPane? PaneOf(LibraryListing source, IEnumerable<ChartResult> results)
    {
        List<string> panes = [.. results
            .Select(result => ResultOf(source, result.DataName)?.ChartPane)
            .OfType<string>()
            .Where(pane => pane != IndicatorResult.PricePane)
            .Distinct()];

        return panes.Count == 1
            ? source.Panes?.FirstOrDefault(pane => pane.Name == panes[0])
            : null;
    }

    /// <summary>
    /// The route segment of an endpoint, absolute or relative: <c>https://host/SMA/</c> → <c>SMA</c>.
    /// </summary>
    internal static string RouteOf(string endpoint)
    {
        string path = endpoint.TrimEnd('/');
        return path[(path.LastIndexOf('/') + 1)..];
    }

    internal static IndicatorParamConfig FromLibrary(string uiid, string route, IndicatorParam param)
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
