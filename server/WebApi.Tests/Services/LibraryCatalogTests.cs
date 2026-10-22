using System.Globalization;
using WebApi.Models;
using ApiListing = WebApi.Models.IndicatorListing;

namespace WebApi.Tests.Services;

public class LibraryCatalogTests
{
    private static readonly List<ApiListing> Served = [.. Metadata.IndicatorListing(string.Empty)];

    private static IndicatorParamConfig ServedParam(string uiid, string paramName)
        => Served.Single(l => l.Uiid == uiid).Parameters.Single(p => p.ParamName == paramName);

    private static IndicatorParam LibraryParam(string libraryId, string paramName)
        => Catalog.Get(Style.Series).Single(l => l.Uiid == libraryId)
            .Parameters!.Single(p => p.ParameterName == paramName);

    [Fact]
    public void EveryParameter_HasADefaultWithinItsBounds()
    {
        List<string> invalid = [.. Served
            .SelectMany(l => l.Parameters.Select(p => (l.Uiid, Param: p)))
            .Where(x => x.Param.DefaultValue is not double value
                || value < x.Param.Minimum
                || value > x.Param.Maximum)
            .Select(x => $"{x.Uiid}.{x.Param.ParamName}: {x.Param.DefaultValue} not in [{x.Param.Minimum}, {x.Param.Maximum}]")];

        Assert.True(invalid.Count == 0, string.Join('\n', invalid));
    }

    [Theory]
    [InlineData("CHOP", "lookbackPeriods", "CHOP", "lookbackPeriods")]
    [InlineData("SMA", "lookbackPeriods", "SMA", "lookbackPeriods")]
    [InlineData("STOCHRSI", "rsiPeriods", "STOCH-RSI", "rsiPeriods")]
    [InlineData("STDEV-CH", "standardDeviations", "STDEV-CHANNELS", "stdDeviations")]
    public void Parameter_TakesBoundsAndDefaultFromTheLibrary(
        string uiid, string paramName, string libraryId, string libraryParamName)
    {
        IndicatorParamConfig served = ServedParam(uiid, paramName);
        IndicatorParam library = LibraryParam(libraryId, libraryParamName);

        Assert.Equal(library.Minimum, served.Minimum);
        Assert.Equal(library.Maximum, served.Maximum);
        Assert.Equal(Convert.ToDouble(library.DefaultValue, CultureInfo.InvariantCulture), served.DefaultValue);
    }

    [Fact]
    public void ForceIndex_KeepsTheConventionalLookbackDefault()
        => Assert.Equal(13, ServedParam("FORCE", "lookbackPeriods").DefaultValue);

    [Fact]
    public void ApplyParameterBounds_ListingWithoutALibraryCounterpart_Throws()
    {
        ApiListing unknown = new() {
            Name = "Unknown",
            Uiid = "UNKNOWN",
            LegendTemplate = "UNKNOWN",
            Endpoint = "/UNKNOWN/",
            Category = "oscillator",
            ChartType = "oscillator",
            Parameters = [new() { DisplayName = "Lookback", ParamName = "lookbackPeriods", DataType = "int" }],
            Results = []
        };

        Assert.Throws<InvalidOperationException>(() => LibraryCatalog.ApplyParameterBounds(unknown));
    }
}
