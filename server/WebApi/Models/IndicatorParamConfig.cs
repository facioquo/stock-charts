namespace WebApi.Models;

[Serializable]
public record IndicatorParamConfig
{
    public required string DisplayName { get; init; }
    public required string ParamName { get; init; }
    public required string DataType { get; init; }

    // Bounds and default come from the library catalog; see LibraryCatalog.
    public double Minimum { get; init; }
    public double Maximum { get; init; }
    public double? DefaultValue { get; init; }
}
