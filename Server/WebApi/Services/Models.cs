namespace WebApi.Services;

public class IndicatorList
{
    public string Name { get; set; }
    public string Uiid { get; set; }
    public string LegendTemplate { get; set; }
    public string Endpoint { get; set; }
    public string Category { get; set; }
    public string ChartType { get; set; }
    public Order Order { get; set; } = Order.Front;

    public ChartConfig ChartConfig { get; set; }

    public virtual ICollection<IndicatorParamConfig> Parameters { get; set; }
    public virtual ICollection<IndicatorResultConfig> Results { get; set; }
}

public enum Order
{
    // price is 75/76
    // thresholds are 99
    Front = 1,
    Behind = 50,
    BehindPrice = 80,
    Back = 95
}

public class IndicatorParamConfig
{
    public string DisplayName { get; set; }
    public string ParamName { get; set; }
    public string DataType { get; set; }
    public double? DefaultValue { get; set; }
    public double Minimum { get; set; } // greater than
    public double Maximum { get; set; } // less than
}

public class IndicatorResultConfig
{
    public string DisplayName { get; set; }
    public string TooltipTemplate { get; set; }
    public string DataName { get; set; }
    public string DataType { get; set; }
    public string LineType { get; set; }
    public string Stack { get; set; }
    public float LineWidth { get; set; } = 2;
    public string DefaultColor { get; set; }
    public ChartFill Fill { get; set; }

}

public class ChartConfig
{
    public double? MinimumYAxis { get; set; }
    public double? MaximumYAxis { get; set; }

    public virtual ICollection<ChartThreshold> Thresholds { get; set; }
}

public class ChartThreshold
{
    public double Value { get; set; }
    public string Color { get; set; }
    public string Style { get; set; }
    public ChartFill Fill { get; set; }
}

public class ChartFill
{
    public string Target { get; set; }
    public string ColorAbove { get; set; }
    public string ColorBelow { get; set; }
}
