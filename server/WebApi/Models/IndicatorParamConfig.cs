namespace WebApi.Models;

[Serializable]
public record IndicatorParamConfig
{
    public required string DisplayName { get; init; }
    public required string ParamName { get; init; }
    public required string DataType { get; init; }
    public required double Minimum { get; init; } // greater than
    public required double Maximum { get; init; } // less than
    public double? DefaultValue { get; init; }
}
