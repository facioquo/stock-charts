namespace WebApi.Services;

public class IndicatorList
{
    public string Name { get; set; }
    public string Uiid { get; set; }
    public string LabelTemplate { get; set; }
    public string Endpoint { get; set; }
    public string Category { get; set; }
    public string ChartType { get; set; }

    public ChartConfig ChartConfig { get; set; }

    public virtual ICollection<IndicatorParamConfig> Parameters { get; set; }
    public virtual ICollection<IndicatorResultConfig> Results { get; set; }
}

public class IndicatorParamConfig
{
    public string DisplayName { get; set; }
    public string ParamName { get; set; }
    public string DataType { get; set; }
    public int Order { get; set; }
    public bool Required { get; set; }
    public double? DefaultValue { get; set; }
    public double Minimum { get; set; } // greater than
    public double Maximum { get; set; } // less than
}

public class IndicatorResultConfig
{
    public string LegendTemplate { get; set; }
    public string DataName { get; set; }
    public string DataType { get; set; }
    public string LineType { get; set; }
    public string DefaultColor { get; set; }
    public string AltChartType { get; set; }
    public ChartConfig AltChartConfig { get; set; }
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
}

public static class Metadata
{
    public static List<IndicatorList> IndicatorList(string baseUrl)
    {
        return new List<IndicatorList>()
        {
            // Bollinger Bands
            new IndicatorList
            {
                Name = "Bollinger Bands®",
                Uiid = "BB",
                LabelTemplate = "BB([P1],[P2])",
                Endpoint = $"{baseUrl}/BB/",
                Category = "price-channel",
                ChartType = "overlay",
                Parameters = new List<IndicatorParamConfig>
                {
                    new IndicatorParamConfig {
                        DisplayName = "Lookback Periods",
                        ParamName = "lookbackPeriods",
                        DataType = "int",
                        Order = 1,
                        Required = true,
                        DefaultValue = 20,
                        Minimum = 2,
                        Maximum = 250
                    },
                    new IndicatorParamConfig {
                        DisplayName = "Standard Deviations",
                        ParamName= "standardDeviations",
                        DataType = "number",
                        Order = 2,
                        Required = true,
                        DefaultValue = 2,
                        Minimum = 0.01,
                        Maximum = 10
                    }
                },
                Results = new List<IndicatorResultConfig>{
                    new IndicatorResultConfig {
                        LegendTemplate = "BB([P1],[P2]) Centerline",
                        DataName = "sma",
                        DataType = "number",
                        DefaultColor = "darkGray"
                    },
                    new IndicatorResultConfig {
                        LegendTemplate = "BB([P1],[P2]) Upper Band",
                        DataName = "upperBand",
                        DataType = "number",
                        DefaultColor = "darkGray"
                    },
                    new IndicatorResultConfig {
                        LegendTemplate = "BB([P1],[P2]) Lower Band",
                        DataName = "lowerBand",
                        DataType = "number",
                        DefaultColor = "darkGray"
                    },
                    new IndicatorResultConfig {
                        LegendTemplate = "BB([P1],[P2]) %B",
                        DataName = "percentB",
                        DataType = "number",
                        DefaultColor = "darkOrange",
                        AltChartType = "oscillator",
                        AltChartConfig = new ChartConfig
                        {
                            Thresholds = new List<ChartThreshold>{
                                new ChartThreshold {
                                    Value = 1,
                                    Color = "darkRed",
                                    Style = "solid"
                                },
                                new ChartThreshold
                                {
                                    Value = 0.5,
                                    Color = "darkGray",
                                    Style = "dotted"
                                },
                                new ChartThreshold
                                {
                                    Value = 0,
                                    Color = "darkGreen",
                                    Style = "solid"
                                }
                            }
                        }
                    }
                }
            },

            // Exponential Moving Average
            new IndicatorList
            {
                Name = "Exponential Moving Average",
                Uiid = "EMA",
                LabelTemplate = "EMA([P1])",
                Endpoint = $"{baseUrl}/EMA/",
                Category = "moving-average",
                ChartType = "overlay",
                Parameters = new List<IndicatorParamConfig>
                {
                    new IndicatorParamConfig {
                        DisplayName = "Lookback Periods",
                        ParamName = "lookbackPeriods",
                        DataType = "int",
                        Order = 1,
                        Required = true,
                        DefaultValue = 20,
                        Minimum = 1,
                        Maximum = 250
                    }
                },
                Results = new List<IndicatorResultConfig>{
                    new IndicatorResultConfig {
                        LegendTemplate = "EMA([P1])",
                        DataName = "ema",
                        DataType = "number",
                        LineType = "line",
                        DefaultColor = "black"
                    }
                }
            },

            // Parabolic SAR
            new IndicatorList
            {
                Name = "Parabolic SAR",
                Uiid = "PSAR",
                LabelTemplate = "PSAR([P1],[P2])",
                Endpoint = $"{baseUrl}/PSAR/",
                Category = "stop-and-reverse",
                ChartType = "overlay",

                Parameters = new List<IndicatorParamConfig>
                {
                    new IndicatorParamConfig {
                        DisplayName = "Step Size",
                        ParamName= "accelerationStep",
                        DataType = "number",
                        Order = 1,
                        Required = true,
                        DefaultValue = 0.02,
                        Minimum = 0.000001,
                        Maximum = 2500
                    },
                    new IndicatorParamConfig {
                        DisplayName = "Max Factor",
                        ParamName= "maxAccelerationFactor",
                        DataType = "number",
                        Order = 2,
                        Required = true,
                        DefaultValue = 0.2,
                        Minimum = 0.000001,
                        Maximum = 2500
                    },
                    //new Param {
                    //    DisplayName = "Initial Factor",
                    //    ParamName= "initialFactor",
                    //    Type = "number",
                    //    Order = 3,
                    //    Required = false,
                    //    Minimum = 0.000001,
                    //    Maximum = 2500
                    //}
                },
                Results = new List<IndicatorResultConfig>{
                    new IndicatorResultConfig {
                        LegendTemplate = "PSAR([P1],[P2])",
                        DataName = "psar",
                        DataType = "number",
                        LineType= "line",
                        DefaultColor = "purple"
                    }
                }
            },

            // Relative Strength Index
            new IndicatorList
            {
                Name = "Relative Strength Index",
                Uiid = "RSI",
                LabelTemplate = "RSI([P1])",
                Endpoint = $"{baseUrl}/RSI/",
                Category = "oscillator",
                ChartType = "oscillator",
                ChartConfig = new ChartConfig
                {
                    MinimumYAxis = 0,
                    MaximumYAxis = 100,

                    Thresholds = new List<ChartThreshold>
                    {
                        new ChartThreshold {
                            Value = 70,
                            Color = "darkRed",
                            Style = "solid"
                        },
                        new ChartThreshold {
                            Value = 30,
                            Color = "darkGreen",
                            Style = "solid"
                        }
                    }
                },
                Parameters = new List<IndicatorParamConfig>
                {
                    new IndicatorParamConfig {
                        DisplayName = "Lookback Periods",
                        ParamName = "lookbackPeriods",
                        DataType = "int",
                        Order = 1,
                        Required = true,
                        DefaultValue = 14,
                        Minimum = 1,
                        Maximum = 250
                    }
                },
                Results = new List<IndicatorResultConfig>{
                    new IndicatorResultConfig {
                        LegendTemplate = "RSI([P1])",
                        DataName = "rsi",
                        DataType = "number",
                        LineType = "line",
                        DefaultColor = "black"
                    }
                }
            },

            // Stochastic Oscillator
            new IndicatorList
            {
                Name = "Stochastic Oscillator",
                Uiid = "STO",
                LabelTemplate = "STO %K([P1]) %D([P2])",
                Endpoint = $"{baseUrl}/STO/",
                Category = "oscillator",
                ChartType = "oscillator",
                ChartConfig = new ChartConfig
                {
                    Thresholds = new List<ChartThreshold>
                    {
                        new ChartThreshold
                        {
                            Value = 80,
                            Color = "darkRed",
                            Style = "solid"
                        },
                        new ChartThreshold
                        {
                            Value = 20,
                            Color = "darkGreen",
                            Style = "solid"
                        }
                    }
                },
                Parameters = new List<IndicatorParamConfig>
                {
                    new IndicatorParamConfig {
                        DisplayName = "Lookback Periods (%K)",
                        ParamName = "lookbackPeriods",
                        DataType = "int",
                        Order = 1,
                        Required = true,
                        DefaultValue = 14,
                        Minimum = 1,
                        Maximum = 250
                    },
                    new IndicatorParamConfig {
                        DisplayName = "Signal Periods (%D)",
                        ParamName = "signalPeriods",
                        DataType = "int",
                        Order = 2,
                        Required = true,
                        DefaultValue = 3,
                        Minimum = 1,
                        Maximum = 250
                    }
                },
                Results = new List<IndicatorResultConfig>{
                    new IndicatorResultConfig {
                        LegendTemplate = "STO %K([P1])",
                        DataName = "k",
                        DataType = "number",
                        LineType = "line",
                        DefaultColor = "black"
                    },
                    new IndicatorResultConfig {
                        LegendTemplate = "STO %D([P2])",
                        DataName = "d",
                        DataType = "number",
                        LineType= "line",
                        DefaultColor = "red"
                    },
                    new IndicatorResultConfig {
                        LegendTemplate = "STO %J",
                        DataName = "j",
                        DataType = "number",
                        LineType = "line",
                        DefaultColor = "green"
                    }
                }
            }
        };
    }
}