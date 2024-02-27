namespace WebApi.Services;

[Serializable]
public record class IndicatorList
{
    public required string Name { get; init; }
    public required string Uiid { get; init; }
    public required string LegendTemplate { get; init; }
    public required string Endpoint { get; init; }
    public required string Category { get; init; }
    public required string ChartType { get; init; }
    public Order Order { get; init; } = Order.Front;

    public ChartConfig? ChartConfig { get; set; }

    public ICollection<IndicatorParamConfig>? Parameters { get; set; }
    public required ICollection<IndicatorResultConfig> Results { get; init; }
}

[Serializable]
public enum Order
{
    // price is 75/76
    // thresholds are 99
    Front = 1,
    Behind = 50,
    BehindPrice = 80,
    Back = 95
}

[Serializable]
public record class IndicatorParamConfig
{
    public required string DisplayName { get; init; }
    public required string ParamName { get; init; }
    public required string DataType { get; init; }
    public required double Minimum { get; init; } // greater than
    public required double Maximum { get; init; } // less than
    public double? DefaultValue { get; init; }
}

[Serializable]
public record class IndicatorResultConfig
{
    public required string DisplayName { get; init; }
    public required string TooltipTemplate { get; init; }
    public required string DataName { get; init; }
    public required string DataType { get; init; }
    public required string LineType { get; init; }
    public string? Stack { get; set; } = null;
    public required float LineWidth { get; set; } = 2;
    public required string DefaultColor { get; init; }
    public ChartFill? Fill { get; set; }

}

[Serializable]
public record class ChartConfig
{
    public double? MinimumYAxis { get; set; }
    public double? MaximumYAxis { get; set; }

    public ICollection<ChartThreshold>? Thresholds { get; set; }
}

[Serializable]
public record class ChartThreshold
{
    public required double Value { get; init; }
    public required string Color { get; init; }
    public required string Style { get; init; }
    public ChartFill? Fill { get; set; }
}

[Serializable]
public record class ChartFill
{
    public required string Target { get; init; }
    public required string ColorAbove { get; init; }
    public required string ColorBelow { get; init; }
}
