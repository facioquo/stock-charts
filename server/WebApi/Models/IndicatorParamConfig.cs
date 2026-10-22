namespace WebApi.Models;

/// <summary>
/// A parameter as the API serves it. <see cref="Services.LibraryCatalog"/> builds each one from
/// the library catalog.
/// </summary>
[Serializable]
public record IndicatorParamConfig
{
    public required string DisplayName { get; init; }
    public required string ParamName { get; init; }
    public required string DataType { get; init; }
    public required double Minimum { get; init; }
    public required double Maximum { get; init; }
    public required double DefaultValue { get; init; }
}
