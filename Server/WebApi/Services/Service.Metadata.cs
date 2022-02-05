namespace WebApi.Services;

public static class Metadata
{
    public static List<IndicatorList> IndicatorList(string baseUrl)
    {
        string standardRed = "#DD2C00";
        //string standardOrange = "#EF6C00";
        //string standardGreen = "#2E7D32";
        string standardBlue = "#1E88E5";
        string standardPurple = "#8E24AA";
        //string standardGray = "#9E9E9E";
        string darkGray = "#757575";
        string darkGrayTransparent = "#75757515";
        string thresholdRed = "#B71C1C70";
        string thresholdGreen = "#1B5E2070";

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
                Order = Order.BehindPrice,
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
                        LabelTemplate = "BB([P1],[P2]) Upper Band",
                        DisplayName = "Upper Band",
                        DataName = "upperBand",
                        DataType = "number",
                        LineType = "solid",
                        LineWidth = 1,
                        DefaultColor = darkGray,
                        Fill = new ChartFill
                        {
                            Target = "+2",
                            ColorAbove = darkGrayTransparent,
                            ColorBelow = darkGrayTransparent
                        }
                    },
                    new IndicatorResultConfig {
                        LabelTemplate = "BB([P1],[P2]) Centerline",
                        DisplayName = "Centerline",
                        DataName = "sma",
                        DataType = "number",
                        LineType = "dash",
                        LineWidth = 1,
                        DefaultColor = darkGray
                    },
                    new IndicatorResultConfig {
                        LabelTemplate = "BB([P1],[P2]) Lower Band",
                        DisplayName = "Lower Band",
                        DataName = "lowerBand",
                        DataType = "number",
                        LineType = "solid",
                        LineWidth = 1,
                        DefaultColor = darkGray
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
                        LabelTemplate = "EMA([P1])",
                        DisplayName = "EMA",
                        DataName = "ema",
                        DataType = "number",
                        LineType = "solid",
                        DefaultColor = standardBlue
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
                    }
                },
                Results = new List<IndicatorResultConfig>{
                    new IndicatorResultConfig {
                        LabelTemplate = "PSAR([P1],[P2])",
                        DisplayName = "PSAR",
                        DataName = "sar",
                        DataType = "number",
                        LineType= "dots",
                        DefaultColor = standardPurple
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
                            Color = thresholdRed,
                            Style = "dash",
                            Fill = new ChartFill
                            {
                                Target = "+2",
                                ColorAbove = "transparent",
                                ColorBelow = thresholdRed
                            }
                        },
                        new ChartThreshold {
                            Value = 30,
                            Color = thresholdGreen,
                            Style = "dash",
                            Fill = new ChartFill
                            {
                                Target = "+1",
                                ColorAbove = thresholdGreen,
                                ColorBelow = "transparent"
                            }
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
                        LabelTemplate = "RSI([P1])",
                        DataName = "rsi",
                        DataType = "number",
                        LineType = "solid",
                        DefaultColor = standardBlue
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
                        new ChartThreshold {
                            Value = 80,
                            Color = thresholdRed,
                            Style = "dash",
                            Fill = new ChartFill
                            {
                                Target = "+2",
                                ColorAbove = "transparent",
                                ColorBelow = thresholdRed
                            }
                        },
                        new ChartThreshold {
                            Value = 20,
                            Color = thresholdGreen,
                            Style = "dash",
                            Fill = new ChartFill
                            {
                                Target = "+1",
                                ColorAbove = thresholdGreen,
                                ColorBelow = "transparent"
                            }
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
                        LabelTemplate = "STO %K([P1])",
                        DisplayName  = "%K",
                        DataName = "k",
                        DataType = "number",
                        LineType = "solid",
                        DefaultColor = standardBlue
                    },
                    new IndicatorResultConfig {
                        LabelTemplate = "STO %D([P2])",
                        DisplayName = "%D",
                        DataName = "d",
                        DataType = "number",
                        LineType= "solid",
                        DefaultColor = standardRed
                    },
                    //new IndicatorResultConfig {
                    //    LabelTemplate = "STO %J",
                    //    DisplayName = "%J",
                    //    DataName = "j",
                    //    DataType = "number",
                    //    LineType = "dash",
                    //    DefaultColor = standardGreen
                    //}
                }
            },

            // Zig Zag (close)
            new IndicatorList
            {
                Name = "Zig Zag (close)",
                Uiid = "ZIGZAG-CL",
                LabelTemplate = "ZIGZAG([P1]% CLOSE)",
                Endpoint = $"{baseUrl}/ZIGZAG-CLOSE/",
                Category = "price-transform",
                ChartType = "overlay",
                Parameters = new List<IndicatorParamConfig>
                {
                    new IndicatorParamConfig {
                        DisplayName = "Percent Change",
                        ParamName = "percentChange",
                        DataType = "number",
                        Order = 1,
                        Required = true,
                        DefaultValue = 5,
                        Minimum = 1,
                        Maximum = 200
                    }
                },
                Results = new List<IndicatorResultConfig>{
                    new IndicatorResultConfig {
                        LabelTemplate = "ZIGZAG([P1]% CLOSE)",
                        DisplayName = "ZigZag",
                        DataName = "zigZag",
                        DataType = "number",
                        LineType = "solid",
                        DefaultColor = standardBlue
                    }
                }
            },

            // Zig Zag (high/low)
            new IndicatorList
            {
                Name = "Zig Zag (high/low)",
                Uiid = "ZIGZAG-HL",
                LabelTemplate = "ZIGZAG([P1]% HIGH/LOW)",
                Endpoint = $"{baseUrl}/ZIGZAG-HIGHLOW/",
                Category = "price-transform",
                ChartType = "overlay",
                Parameters = new List<IndicatorParamConfig>
                {
                    new IndicatorParamConfig {
                        DisplayName = "Percent Change",
                        ParamName = "percentChange",
                        DataType = "number",
                        Order = 1,
                        Required = true,
                        DefaultValue = 5,
                        Minimum = 1,
                        Maximum = 200
                    }
                },
                Results = new List<IndicatorResultConfig>{
                    new IndicatorResultConfig {
                        LabelTemplate = "ZIGZAG([P1]% HIGH/LOW)",
                        DisplayName = "ZigZag",
                        DataName = "zigZag",
                        DataType = "number",
                        LineType = "solid",
                        DefaultColor = standardBlue
                    }
                }
            }
        };
    }
}
