using WebApi.Models;
using ApiListing = WebApi.Models.IndicatorListing;
using LibraryListing = FacioQuo.Stock.Indicators.IndicatorListing;

namespace WebApi.Tests.Services;

/// <summary>
/// Keeps the parameter ranges the demo offers inside the bounds the library's own
/// <see cref="Catalog"/> accepts, so a settings dialog cannot offer a value the
/// library rejects (CHOP with a lookback of 1, for example, returns 400).
/// </summary>
public class CatalogLibraryParityTests
{
    /// <summary>
    /// API endpoints whose path is not the library's catalog id.
    /// </summary>
    private static readonly Dictionary<string, string> LibraryIdByEndpoint = new(StringComparer.Ordinal) {
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
    /// Query parameters the API names differently from the library, keyed by endpoint and API name.
    /// </summary>
    private static readonly Dictionary<(string Endpoint, string ParamName), string> LibraryParamNames = new() {
        [("STDEV-CH", "standardDeviations")] = "stdDeviations"
    };

    private static string EndpointPath(ApiListing listing) => listing.Endpoint.Trim('/');

    [Fact]
    public void EveryParameterRange_StaysWithinTheLibraryCatalogBounds()
    {
        Dictionary<string, LibraryListing> library = Catalog.Get(Style.Series)
            .ToDictionary(listing => listing.Uiid, StringComparer.Ordinal);

        List<string> drift = [];

        // Endpoints are relative with an empty base URL, so the trimmed path is the route.
        foreach (ApiListing listing in Metadata.IndicatorListing(string.Empty).Where(l => l.Parameters.Count > 0))
        {
            string endpoint = EndpointPath(listing);
            string libraryId = LibraryIdByEndpoint.GetValueOrDefault(endpoint, endpoint);

            if (!library.TryGetValue(libraryId, out LibraryListing? match))
            {
                drift.Add($"{listing.Uiid}: no library catalog listing '{libraryId}'");
                continue;
            }

            foreach (IndicatorParamConfig param in listing.Parameters)
            {
                string libraryName = LibraryParamNames.GetValueOrDefault((endpoint, param.ParamName), param.ParamName);
                IndicatorParam? bounds = match.Parameters?
                    .FirstOrDefault(p => string.Equals(p.ParameterName, libraryName, StringComparison.Ordinal));

                if (bounds is null)
                {
                    drift.Add($"{listing.Uiid}.{param.ParamName}: not a parameter of library listing '{libraryId}'");
                    continue;
                }

                if (param.Minimum < bounds.Minimum || param.Maximum > bounds.Maximum)
                {
                    drift.Add(
                        $"{listing.Uiid}.{param.ParamName}: [{param.Minimum}, {param.Maximum}] is wider than the library's [{bounds.Minimum}, {bounds.Maximum}]");
                }
            }
        }

        Assert.True(drift.Count == 0, "Catalog drifted from the library:\n" + string.Join('\n', drift));
    }
}
