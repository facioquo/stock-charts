namespace WebApi.Services;

public static class Metadata
{
    public static IEnumerable<IndicatorListing> IndicatorListing(string baseUrl)
        => [.. ChartListings(baseUrl).Select(LibraryCatalog.Build).OrderBy(x => x.Name)];

    /// <summary>
    /// How the demo charts each library listing. A name, category, chart type, display name, or
    /// axis bound is set only where the demo differs from the library; <see cref="LibraryCatalog"/>
    /// supplies the rest.
    /// </summary>
    internal static List<ChartListing> ChartListings(string baseUrl)
    {
        // Organized alphabetically

        List<ChartListing> listing = [
            // Accumulation Distribution Line (ADL)
            new() {
                Uiid = "ADL",
                LegendTemplate = "ADL",
                Endpoint = $"{baseUrl}/ADL/",
                Results = [
                    new() {
                        DisplayName = "ADL",
                        TooltipTemplate = "ADL",
                        DataName = "adl",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Arnaud Legoux Moving Average (ALMA)
            new ChartListing {
                Uiid = "ALMA",
                LegendTemplate = "ALMA([P1],[P2],[P3])",
                Endpoint = $"{baseUrl}/ALMA/",
                Results = [
                    new() {
                        DisplayName = "ALMA",
                        TooltipTemplate = "ALMA([P1],[P2],[P3])",
                        DataName = "alma",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Aroon Up/Down
            new ChartListing {
                Uiid = "AROON UP/DOWN",
                LegendTemplate = "AROON([P1]) Up/Down",
                Endpoint = $"{baseUrl}/AROON/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 70,
                            Color = ChartColors.ThresholdGrayTransparent,
                            Style = "solid"
                        },
                        new() {
                            Value = 50,
                            Color = ChartColors.ThresholdGrayTransparent,
                            Style = "dash"
                        },
                        new() {
                            Value = 30,
                            Color = ChartColors.ThresholdGrayTransparent,
                            Style = "solid"
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "Aroon Up",
                        DataName = "aroonUp",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardGreen
                    },
                    new() {
                        TooltipTemplate = "Aroon Down",
                        DataName = "aroonDown",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardRed
                    }
                ]
            },

            // Aroon Oscillator
            new ChartListing {
                Name = "Aroon Oscillator",
                Uiid = "AROON OSC",
                LegendTemplate = "AROON([P1]) Oscillator",
                Endpoint = $"{baseUrl}/AROON/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 0,
                            Color = ChartColors.ThresholdGrayTransparent,
                            Style = "dash"
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "AROON([P1]) Oscillator",
                        DataName = "oscillator",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // ATR Trailing Stop (Close offset)
            new ChartListing {
                Name = "ATR Trailing Stop (Close offset)",
                Uiid = "ATR-STOP-CLOSE",
                LegendTemplate = "ATR-STOP([P1],[P2],CLOSE)",
                Endpoint = $"{baseUrl}/ATR-STOP-CLOSE/",
                Order = Order.Front,
                Results = [
                    new() {
                        TooltipTemplate = "ATR-STOP([P1],[P2],CLOSE) Buy Stop",
                        DataName = "buyStop",
                        LineType = "dots",
                        LineWidth = 2,
                        DefaultColor = ChartColors.StandardGreen
                    },
                    new() {
                        TooltipTemplate = "ATR-STOP([P1],[P2],CLOSE) Sell Stop",
                        DataName = "sellStop",
                        LineType = "dots",
                        LineWidth = 2,
                        DefaultColor = ChartColors.StandardRed
                    }
                ]
            },

            // ATR Trailing Stop (High/Low offset)
            new ChartListing {
                Name = "ATR Trailing Stop (High/Low offset)",
                Uiid = "ATR-STOP-HL",
                LegendTemplate = "ATR-STOP([P1],[P2],HIGH/LOW)",
                Endpoint = $"{baseUrl}/ATR-STOP-HL/",
                Order = Order.Front,
                Results = [
                    new() {
                        TooltipTemplate = "ATR-STOP([P1],[P2],HIGH/LOW) Buy Stop",
                        DataName = "buyStop",
                        LineType = "dots",
                        LineWidth = 2,
                        DefaultColor = ChartColors.StandardGreen
                    },
                    new() {
                        TooltipTemplate = "ATR-STOP([P1],[P2],HIGH/LOW) Sell Stop",
                        DataName = "sellStop",
                        LineType = "dots",
                        LineWidth = 2,
                        DefaultColor = ChartColors.StandardRed
                    }
                ]
            },

            // Average Directional Index (ADX)
            new ChartListing {
                Uiid = "ADX",
                LegendTemplate = "ADX([P1])",
                Endpoint = $"{baseUrl}/ADX/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 40,
                            Color = ChartColors.ThresholdGrayTransparent,
                            Style = "dash"
                        },
                        new() {
                            Value = 20,
                            Color = ChartColors.ThresholdGrayTransparent,
                            Style = "dash"
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "ADX([P1])",
                        DataName = "adx",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    },
                    new() {
                        DisplayName = "DI+",
                        TooltipTemplate = "DI+([P1])",
                        DataName = "pdi",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardGreen
                    },
                    new() {
                        DisplayName = "DI-",
                        TooltipTemplate = "DI-([P1])",
                        DataName = "mdi",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardRed
                    },
                    new() {
                        DisplayName = "ADX Rating",
                        TooltipTemplate = "ADXR([P1])",
                        DataName = "adxr",
                        LineType = "solid",
                        LineWidth = 2,
                        DefaultColor = ChartColors.StandardGrayTransparent
                    }
                ]
            },

            // Average True Range
            new ChartListing {
                Uiid = "ATR",
                LegendTemplate = "ATR([P1])",
                Endpoint = $"{baseUrl}/ATR/",
                Results = [
                    new() {
                        DisplayName = "Average True Range",
                        TooltipTemplate = "ATR([P1])",
                        DataName = "atr",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Average True Range Percent
            new ChartListing {
                Name = "Average True Range (ATR) Percent",
                Uiid = "ATRP",
                LegendTemplate = "ATR([P1]) %",
                Endpoint = $"{baseUrl}/ATR/",
                Results = [
                    new() {
                        DisplayName = "Average True Range Percent",
                        TooltipTemplate = "ATR([P1]) %",
                        DataName = "atrp",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Awesome Oscillator
            new ChartListing {
                Name = "Awesome Oscillator (AO)",
                Uiid = "AO",
                LegendTemplate = "AO([P1],[P2])",
                Endpoint = $"{baseUrl}/AWESOME/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 0,
                            Color = ChartColors.ThresholdGrayTransparent,
                            Style = "dash"
                        }
                    ]
                },
                Results = [
                    new() {
                        DisplayName = "Awesome Oscillator",
                        TooltipTemplate = "AO([P1],[P2])",
                        DataName = "oscillator",
                        LineType = "bar",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Balance of Power (BOP)
            new ChartListing {
                Uiid = "BOP",
                LegendTemplate = "BOP([P1])",
                Endpoint = $"{baseUrl}/BOP/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 0,
                            Color = ChartColors.ThresholdGrayTransparent,
                            Style = "dash"
                        }
                    ]
                },
                Results = [
                    new() {
                        DisplayName = "Balance of Power",
                        TooltipTemplate = "BOP([P1])",
                        DataName = "bop",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Beta
            new ChartListing {
                Uiid = "BETA",
                LegendTemplate = "BETA([P1])",
                Endpoint = $"{baseUrl}/BETA/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 1,
                            Color = ChartColors.ThresholdGrayTransparent,
                            Style = "dash"
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "Beta",
                        DataName = "beta",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    },
                    new() {
                        DisplayName = "Beta+",
                        TooltipTemplate = "Beta+",
                        DataName = "betaUp",
                        LineType = "dash",
                        DefaultColor = ChartColors.StandardGreen
                    },
                    new() {
                        DisplayName = "Beta-",
                        TooltipTemplate = "Beta-",
                        DataName = "betaDown",
                        LineType = "dash",
                        DefaultColor = ChartColors.StandardRed
                    }
                ]
            },

            // Bollinger Bands
            new ChartListing {
                Uiid = "BB",
                LegendTemplate = "BB([P1],[P2])",
                Endpoint = $"{baseUrl}/BB/",
                Order = Order.BehindPrice,
                Results = [
                    new() {
                        TooltipTemplate = "BB([P1],[P2]) Upper Band",
                        DataName = "upperBand",
                        LineType = "solid",
                        LineWidth = 1,
                        DefaultColor = ChartColors.StandardOrange,
                        Fill = new ChartFill {
                            Target = "+2",
                            ColorAbove = ChartColors.DarkGrayTransparent,
                            ColorBelow = ChartColors.DarkGrayTransparent
                        }
                    },
                    new() {
                        DisplayName = "Centerline",
                        TooltipTemplate = "BB([P1],[P2]) Centerline",
                        DataName = "sma",
                        LineType = "dash",
                        LineWidth = 1,
                        DefaultColor = ChartColors.StandardOrange
                    },
                    new() {
                        TooltipTemplate = "BB([P1],[P2]) Lower Band",
                        DataName = "lowerBand",
                        LineType = "solid",
                        LineWidth = 1,
                        DefaultColor = ChartColors.StandardOrange
                    }
                ]
            },

            // Bollinger Bands %B
            new ChartListing {
                Name = "Bollinger Bands® %B",
                Uiid = "BB-PCTB",
                LegendTemplate = "BB([P1],[P2]) %B",
                Endpoint = $"{baseUrl}/BB/",
                Category = "oscillator",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 1,
                            Color = ChartColors.ThresholdRed,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+2",
                                ColorAbove = "transparent",
                                ColorBelow = ChartColors.ThresholdGreen
                            }
                        },
                        new() {
                            Value = 0,
                            Color = ChartColors.ThresholdGreen,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+1",
                                ColorAbove = ChartColors.ThresholdRed,
                                ColorBelow = "transparent"
                            }
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "BB([P1],[P2]) %B",
                        DataName = "percentB",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue,
                    }
                ]
            },

            // Chaikin Money Flow
            new ChartListing {
                Uiid = "CMF",
                LegendTemplate = "CMF([P1])",
                Endpoint = $"{baseUrl}/CMF/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 0,
                            Color = ChartColors.ThresholdGrayTransparent,
                            Style = "dash"
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "Chaikin Money Flow",
                        DataName = "cmf",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Chaikin Oscillator
            new ChartListing {
                Name = "Chaikin Oscillator",
                Uiid = "CHAIKIN",
                LegendTemplate = "CHAIKIN([P1],[P2])",
                Endpoint = $"{baseUrl}/CHAIKIN/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 0,
                            Color = ChartColors.ThresholdGrayTransparent,
                            Style = "dash"
                        }
                    ]
                },
                Results = [
                    new() {
                        DisplayName = "Chaikin Oscillator",
                        TooltipTemplate = "CHAIKIN([P1],[P2])",
                        DataName = "oscillator",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Chande Momentum Oscillator
            new ChartListing {
                Uiid = "CMO",
                LegendTemplate = "CMO([P1])",
                Endpoint = $"{baseUrl}/CMO/",
                Results = [
                    new() {
                        DisplayName = "Chande Momentum Oscillator",
                        TooltipTemplate = "CMO([P1])",
                        DataName = "cmo",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Chandelier Exit (long)
            new ChartListing {
                Name = "Chandelier Exit (long)",
                Uiid = "CHEXIT-LONG",
                LegendTemplate = "CHANDELIER([P1],[P2],LONG)",
                Endpoint = $"{baseUrl}/CHEXIT-LONG/",
                Results = [
                    new() {
                        TooltipTemplate = "CHANDELIER([P1],[P2],LONG)",
                        DataName = "chandelierExit",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardOrange
                    }
                ]
            },

            // Chandelier Exit (short)
            new ChartListing {
                Name = "Chandelier Exit (short)",
                Uiid = "CHEXIT-SHORT",
                LegendTemplate = "CHANDELIER([P1],[P2],SHORT)",
                Endpoint = $"{baseUrl}/CHEXIT-SHORT/",
                Results = [
                    new() {
                        TooltipTemplate = "CHANDELIER([P1],[P2],SHORT)",
                        DataName = "chandelierExit",
                        LineType = "dash",
                        DefaultColor = ChartColors.StandardOrange
                    }
                ]
            },

            // Choppiness Index
            new ChartListing {
                Uiid = "CHOP",
                LegendTemplate = "CHOP([P1])",
                Endpoint = $"{baseUrl}/CHOP/",
                ChartConfig = new ChartConfig {
                    //MinimumYAxis = 0,
                    //MaximumYAxis = 100,

                    Thresholds =
                    [
                        new() {
                            Value = 61.8,
                            Color = ChartColors.DarkGrayTransparent,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+2",
                                ColorAbove = "transparent",
                                ColorBelow = ChartColors.ThresholdRed
                            }
                        },
                        new() {
                            Value = 38.2,
                            Color = ChartColors.DarkGrayTransparent,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+1",
                                ColorAbove = ChartColors.ThresholdGreen,
                                ColorBelow = "transparent"
                            }
                        }
                    ]
                },
                Results = [
                    new() {
                        DisplayName = "Choppiness",
                        TooltipTemplate = "Choppiness",
                        DataName = "chop",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Commodity Channel Index
            new ChartListing {
                Uiid = "CCI",
                LegendTemplate = "CCI([P1])",
                Endpoint = $"{baseUrl}/CCI/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 100,
                            Color = ChartColors.ThresholdRed,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+3",
                                ColorAbove = "transparent",
                                ColorBelow = ChartColors.ThresholdGreen
                            }
                        },
                        new() {
                            Value = 0,
                            Color = ChartColors.DarkGrayTransparent,
                            Style = "dash",
                            Fill = null
                        },
                        new() {
                            Value = -100,
                            Color = ChartColors.ThresholdGreen,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+1",
                                ColorAbove = ChartColors.ThresholdRed,
                                ColorBelow = "transparent"
                            }
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "CCI([P1])",
                        DataName = "cci",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // ConnorsRSI
            new ChartListing {
                Uiid = "CRSI",
                LegendTemplate = "CRSI([P1],[P2],[P3])",
                Endpoint = $"{baseUrl}/CRSI/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 90,
                            Color = ChartColors.ThresholdRed,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+2",
                                ColorAbove = "transparent",
                                ColorBelow = ChartColors.ThresholdGreen
                            }
                        },
                        new() {
                            Value = 10,
                            Color = ChartColors.ThresholdGreen,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+1",
                                ColorAbove = ChartColors.ThresholdRed,
                                ColorBelow = "transparent"
                            }
                        }
                    ]
                },
                Results = [
                    new() {
                        DisplayName = "CRSI",
                        TooltipTemplate = "CRSI([P1],[P2],[P3])",
                        DataName = "connorsRsi",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Correlation Coefficient
            // Correlation (-1 to 1) and R² (0 to 1) are both dimensionless, so
            // sharing one y-axis does not mislead.
            new ChartListing {
                Name = "Correlation Coefficient (vs SPY)",
                Uiid = "CORRELATION",
                LegendTemplate = "CORRELATION([P1])",
                Endpoint = $"{baseUrl}/CORRELATION/",
                Category = "price-characteristic",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        // Above zero tracks the benchmark, below inverts it.
                        new() {
                            Value = 0,
                            Color = ChartColors.ThresholdGrayTransparent,
                            Style = "dash"
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "Correlation",
                        DataName = "correlation",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    },
                    new() {
                        DisplayName = "R²",
                        TooltipTemplate = "R-Squared",
                        DataName = "rSquared",
                        LineType = "dash",
                        DefaultColor = ChartColors.StandardGreen
                    }
                ]
            },

            // Detrended Price Oscillator (DPO)
            new ChartListing {
                Name = "Detrended Price Oscillator (DPO)",
                Uiid = "DPO",
                LegendTemplate = "DPO([P1])",
                Endpoint = $"{baseUrl}/DPO/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 0,
                            Color = ChartColors.ThresholdGrayTransparent,
                            Style = "dash"
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "DPO([P1])",
                        DataName = "dpo",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Doji
            new ChartListing {
                Uiid = "DOJI",
                LegendTemplate = "DOJI([P1]%)",
                Endpoint = $"{baseUrl}/DOJI/",
                ChartType = "overlay",
                Results = [
                    new() {
                        TooltipTemplate = "DOJI([P1]%)",
                        DisplayName = "Doji",
                        DataName = "price",
                        LineType = "pointer",
                        LineWidth = 8,
                        DefaultColor = ChartColors.DarkGray
                    }
                ]
            },

            // Dominant Cycle Period (HT Trendline)
            new ChartListing {
                Name = "Dominant Cycle Periods",
                Uiid = "DCPERIOD",
                LegendTemplate = "DC PERIODS",
                Endpoint = $"{baseUrl}/HTL/",
                Category = "price-characteristic",
                ChartConfig = new ChartConfig {
                    MinimumYAxis = 0
                },
                Results = [
                    new() {
                        DisplayName = "DC PERIODS",
                        TooltipTemplate = "DC PERIODS",
                        DataName = "dcPeriods",
                        LineType = "bar",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Donchian Channels
            new ChartListing {
                Uiid = "DONCHIAN",
                LegendTemplate = "DONCHIAN([P1])",
                Endpoint = $"{baseUrl}/DONCHIAN/",
                Order = Order.BehindPrice,
                Results = MetadataHelpers.GetPriceBandResults("DONCHIAN", ChartColors.StandardOrange)
            },

            // Double Exponential Moving Average (DEMA)
            new ChartListing {
                Name = "Double Exponential Moving Average (DEMA)",
                Uiid = "DEMA",
                LegendTemplate = "DEMA([P1])",
                Endpoint = $"{baseUrl}/DEMA/",
                Results = [
                    new() {
                        TooltipTemplate = "DEMA([P1])",
                        DataName = "dema",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Dynamic, McGinley
            new ChartListing {
                Uiid = "DYN",
                LegendTemplate = "DYNAMIC([P1])",
                Endpoint = $"{baseUrl}/DYN/",
                Results = [
                    new() {
                        DisplayName = "Dynamic",
                        TooltipTemplate = "DYNAMIC([P1])",
                        DataName = "dynamic",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Elder-ray
            new ChartListing {
                Uiid = "ELDER-RAY",
                LegendTemplate = "ELDER-RAY([P1])",
                Endpoint = $"{baseUrl}/ELDER-RAY/",
                Results = [
                    new() {
                        TooltipTemplate = "Bull Power",
                        DataName = "bullPower",
                        LineType = "bar",
                        Stack = "eray",
                        DefaultColor = ChartColors.StandardGreen
                    },
                    new() {
                        TooltipTemplate = "Bear Power",
                        DataName = "bearPower",
                        LineType = "bar",
                        Stack = "eray",
                        DefaultColor = ChartColors.StandardRed
                    }
                ]
            },

            // Endpoint Moving Average
            new ChartListing {
                Name = "Endpoint Moving Average (EPMA)",
                Uiid = "EPMA",
                LegendTemplate = "EPMA([P1])",
                Endpoint = $"{baseUrl}/EPMA/",
                Results = [
                    new() {
                        TooltipTemplate = "EPMA([P1])",
                        DataName = "epma",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Exponential Moving Average
            new ChartListing {
                Name = "Exponential Moving Average (EMA)",
                Uiid = "EMA",
                LegendTemplate = "EMA([P1])",
                Endpoint = $"{baseUrl}/EMA/",
                Results = [
                    new() {
                        TooltipTemplate = "EMA([P1])",
                        DataName = "ema",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Fisher Transform
            new ChartListing {
                Uiid = "FISHER",
                LegendTemplate = "FISHER([P1])",
                Endpoint = $"{baseUrl}/FISHER/",
                Results = [
                    new() {
                        DisplayName = "Fisher Transform",
                        TooltipTemplate = "Fisher Transform",
                        DataName = "fisher",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    },
                    new() {
                        TooltipTemplate = "Trigger",
                        DataName = "trigger",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardRed
                    }
                ]
            },

            // Force Index
            new ChartListing {
                Uiid = "FORCE",
                LegendTemplate = "FORCE([P1])",
                Endpoint = $"{baseUrl}/FORCE/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 0,
                            Color = ChartColors.ThresholdGrayTransparent,
                            Style = "dash"
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "FORCE([P1])",
                        DataName = "forceIndex",
                        LineType = "bar",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Fractal (Williams)
            new ChartListing {
                Uiid = "FRACTAL",
                LegendTemplate = "FRACTAL([P1])",
                Endpoint = $"{baseUrl}/FRACTAL/",
                Results = [
                    new() {
                        DisplayName = "Fractal Bull",
                        TooltipTemplate = "Fractal Bull ([P1])",
                        DataName = "fractalBull",
                        LineType = "dots",
                        LineWidth = 3,
                        DefaultColor = ChartColors.StandardRed
                    },
                    new() {
                        DisplayName = "Fractal Bear",
                        TooltipTemplate = "Fractal Bear ([P1])",
                        DataName = "fractalBear",
                        LineType = "dots",
                        LineWidth = 3,
                        DefaultColor = ChartColors.StandardGreen
                    }
                ]
            },

            // Fractal Chaos Bands (FCB)
            new ChartListing {
                Uiid = "FCB",
                LegendTemplate = "FCB([P1])",
                Endpoint = $"{baseUrl}/FCB/",
                Order = Order.Front,
                Results = [
                    new() {
                        TooltipTemplate = "Upper Band",
                        DisplayName = "FCB([P1]) Upper Band",
                        DataName = "upperBand",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardGreen
                    },
                    new() {
                        TooltipTemplate = "FCB([P1]) Lower Band",
                        DataName = "lowerBand",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardRed
                    }
                ]
            },

            // Gator Oscillator (derived from Williams Alligator)
            new ChartListing {
                Uiid = "GATOR",
                LegendTemplate = "GATOR",
                Endpoint = $"{baseUrl}/GATOR/",
                Category = "price-trend",
                Results = [
                    new() {
                        TooltipTemplate = "Upper",
                        DataName = "upper",
                        LineType = "bar",
                        Stack = "gator",
                        DefaultColor = ChartColors.StandardGreen
                    },
                    new() {
                        TooltipTemplate = "Lower",
                        DataName = "lower",
                        LineType = "bar",
                        Stack = "gator",
                        DefaultColor = ChartColors.StandardRed
                    }
                ]
            },

            // Heikin-Ashi
            new ChartListing {
                Name = "Heikin-Ashi",
                Uiid = "HEIKIN-ASHI",
                LegendTemplate = "HEIKIN-ASHI",
                Endpoint = $"{baseUrl}/HEIKIN-ASHI/",
                // Overlay that REPLACES the raw price candles: the client
                // hides the main price dataset while a candle-rendered overlay
                // is displayed (both series sit at nearly the same prices, so
                // drawing them together occludes each other) and restores it
                // when the selection is removed.
                Results = [
                    new() {
                        DisplayName = "Heikin-Ashi",
                        TooltipTemplate = "HEIKIN-ASHI",
                        // LineType "candle" reads open/high/low/close from each
                        // row; dataName anchors tooltips and result identity.
                        DataName = "close",
                        LineType = "candle",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Hilbert Transform Instantaneous Trendline
            new ChartListing {
                Uiid = "HT Trendline",
                LegendTemplate = "HT TRENDLINE",
                Endpoint = $"{baseUrl}/HTL/",
                Results = [
                    new() {
                        DisplayName = "HT Trendline",
                        TooltipTemplate = "HT Trendline",
                        DataName = "trendline",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    },
                    new() {
                        DisplayName = "HT Smoothed Price",
                        TooltipTemplate = "HT Smooth Price",
                        DataName = "smoothPrice",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardOrange
                    }
                ]
            },

            // Hull Moving Average (HMA)
            new ChartListing {
                Name = "Hull Moving Average (HMA)",
                Uiid = "HMA",
                LegendTemplate = "HMA([P1])",
                Endpoint = $"{baseUrl}/HMA/",
                Results = [
                    new() {
                        TooltipTemplate = "HMA([P1])",
                        DataName = "hma",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Hurst Exponent
            new ChartListing {
                Uiid = "HURST",
                LegendTemplate = "HURST([P1])",
                Endpoint = $"{baseUrl}/HURST/",
                ChartConfig = new ChartConfig {
                    MinimumYAxis = 0,
                    MaximumYAxis = 1,

                    Thresholds =
                    [
                        new() {
                            Value = 0.5,
                            Color = ChartColors.ThresholdGrayTransparent,
                            Style = "dash"
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "HURST([P1])",
                        DataName = "hurstExponent",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Ichimoku Cloud
            new ChartListing {
                Uiid = "ICHIMOKU",
                LegendTemplate = "ICHIMOKU([P1],[P2],[P3])",
                Endpoint = $"{baseUrl}/ICHIMOKU/",
                Order = Order.BehindPrice,
                Results = [
                    new() {
                        TooltipTemplate = "ICHIMOKU([P1],[P2],[P3] Tenkan-sen",
                        DataName = "tenkanSen",
                        LineType = "solid",
                        LineWidth = 2,
                        DefaultColor = ChartColors.StandardBlue,
                    },
                    new() {
                        TooltipTemplate = "ICHIMOKU([P1],[P2],[P3] Kijun-sen",
                        DataName = "kijunSen",
                        LineType = "solid",
                        LineWidth = 2,
                        DefaultColor = ChartColors.StandardPurple,
                    },
                    new() {
                        DisplayName = "Chikou span",
                        TooltipTemplate = "ICHIMOKU([P1],[P2],[P3] Chikou span",
                        DataName = "chikouSpan",
                        LineType = "solid",
                        LineWidth = 2,
                        DefaultColor = ChartColors.DarkGray,
                    },
                    new() {
                        DisplayName = "Senkou span A",
                        TooltipTemplate = "ICHIMOKU([P1],[P2],[P3] Senkou span A",
                        DataName = "senkouSpanA",
                        LineType = "solid",
                        LineWidth = 1.5f,
                        DefaultColor = ChartColors.ThresholdGreen,
                    },
                    new() {
                        DisplayName = "Senkou span B",
                        TooltipTemplate = "ICHIMOKU([P1],[P2],[P3] Senkou span B",
                        DataName = "senkouSpanB",
                        LineType = "solid",
                        LineWidth = 1.5f,
                        DefaultColor = ChartColors.ThresholdRed,
                        Fill = new ChartFill {
                            Target = "-1",
                            ColorAbove = ChartColors.ThresholdRedTransparent,
                            ColorBelow = ChartColors.ThresholdGreenTransparent
                        }
                    }
                ]
            },

            // Kaufman Adaptive Moving Average (KAMA)
            new ChartListing {
                Name = "Kaufman Adaptive Moving Average (KAMA)",
                Uiid = "KAMA",
                LegendTemplate = "KAMA([P1],[P2],[P3])",
                Endpoint = $"{baseUrl}/KAMA/",
                Results = [
                    new() {
                        TooltipTemplate = "KAMA([P1],[P2],[P3])",
                        DataName = "kama",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Keltner Channels
            new ChartListing {
                Uiid = "KELTNER",
                LegendTemplate = "KELTNER([P1],[P2],[P3])",
                Endpoint = $"{baseUrl}/KELTNER/",
                Order = Order.BehindPrice,
                Results = MetadataHelpers.GetPriceBandResults("KELTNER", ChartColors.StandardOrange)
            },

            // Klinger Volume Oscillator (KVO)
            new ChartListing {
                Name = "Klinger Volume Oscillator (KVO)",
                Uiid = "KVO",
                LegendTemplate = "KVO([P1],[P2],[P3])",
                Endpoint = $"{baseUrl}/KVO/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 0,
                            Color = ChartColors.ThresholdGrayTransparent,
                            Style = "dash"
                        }
                    ]
                },
                Results = [
                    new() {
                        DisplayName = "KVO",
                        TooltipTemplate = "KVO([P1],[P2],[P3])",
                        DataName = "oscillator",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    },
                    new() {
                        TooltipTemplate = "KVO Signal",
                        DataName = "signal",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardRed
                    }
                ]
            },

            // Linear Regression
            new ChartListing {
                Name = "Linear Regression",
                Uiid = "LINEAR",
                LegendTemplate = "LINEAR([P1])",
                Endpoint = $"{baseUrl}/SLOPE/",
                Results = [
                    new() {
                        DisplayName = "Linear Regression",
                        TooltipTemplate = "LINEAR([P1])",
                        DataName = "line",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Marubozu
            new ChartListing {
                Uiid = "MARUBOZU",
                LegendTemplate = "MARUBOZU([P1]%)",
                Endpoint = $"{baseUrl}/MARUBOZU/",
                ChartType = "overlay",
                Results = [
                    new() {
                        DisplayName = "Marubozu",
                        TooltipTemplate = "MARUBOZU([P1]%)",
                        DataName = "price",
                        LineType = "pointer",
                        LineWidth = 8,
                        DefaultColor = ChartColors.DarkGray
                    }
                ]
            },

            // MESA Adaptive Moving Average (MAMA)
            new ChartListing {
                Name = "MESA Adaptive Moving Average (MAMA)",
                Uiid = "MAMA",
                LegendTemplate = "MAMA([P1],[P2])",
                Endpoint = $"{baseUrl}/MAMA/",
                Results = [
                    new() {
                        TooltipTemplate = "MAMA([P1],[P2])",
                        DataName = "mama",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    },
                    new() {
                        TooltipTemplate = "FAMA([P1],[P2])",
                        DataName = "fama",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardRed
                    }
                ]
            },

            // Money Flow Index
            new ChartListing {
                Uiid = "MFI",
                LegendTemplate = "MFI([P1])",
                Endpoint = $"{baseUrl}/MFI/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 80,
                            Color = ChartColors.ThresholdRed,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+2",
                                ColorAbove = "transparent",
                                ColorBelow = ChartColors.ThresholdGreen
                            }
                        },
                        new() {
                            Value = 20,
                            Color = ChartColors.ThresholdGreen,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+1",
                                ColorAbove = ChartColors.ThresholdRed,
                                ColorBelow = "transparent"
                            }
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "MFI([P1])",
                        DataName = "mfi",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Moving Average Convergence/Divergence
            new ChartListing {
                Name = "Moving Average Convergence/Divergence (MACD)",
                Uiid = "MACD",
                LegendTemplate = "MACD([P1],[P2],[P3])",
                Endpoint = $"{baseUrl}/MACD/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 0,
                            Color = ChartColors.DarkGrayTransparent,
                            Style = "dash"
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "MACD",
                        DataName = "macd",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    },
                    new() {
                        TooltipTemplate = "Signal",
                        DataName = "signal",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardRed
                    },
                    new() {
                        TooltipTemplate = "Histogram",
                        DataName = "histogram",
                        LineType = "bar",
                        DefaultColor = ChartColors.StandardGrayTransparent
                    }
                ]
            },

            // Moving Average Envelopes
            new ChartListing {
                Uiid = "MA-ENV",
                LegendTemplate = "MA-ENV([P1],[P2]%)",
                Endpoint = $"{baseUrl}/MA-ENV/",
                Order = Order.BehindPrice,
                Results = [
                    new() {
                        TooltipTemplate = "MA-ENV([P1],[P2]%) Upper",
                        DataName = "upperEnvelope",
                        LineType = "solid",
                        LineWidth = 1,
                        DefaultColor = ChartColors.StandardOrange,
                        Fill = new ChartFill {
                            Target = "+2",
                            ColorAbove = ChartColors.DarkGrayTransparent,
                            ColorBelow = ChartColors.DarkGrayTransparent
                        }
                    },
                    new() {
                        TooltipTemplate = "MA-ENV([P1],[P2]%) Center",
                        DataName = "centerline",
                        LineType = "dash",
                        LineWidth = 1,
                        DefaultColor = ChartColors.StandardOrange
                    },
                    new() {
                        TooltipTemplate = "MA-ENV([P1],[P2]%) Lower",
                        DataName = "lowerEnvelope",
                        LineType = "solid",
                        LineWidth = 1,
                        DefaultColor = ChartColors.StandardOrange
                    }
                ]
            },

            // On-Balance Volume (OBV)
            new ChartListing {
                Name = "On-Balance Volume (OBV)",
                Uiid = "OBV",
                LegendTemplate = "OBV",
                Endpoint = $"{baseUrl}/OBV/",
                Results = [
                    new() {
                        TooltipTemplate = "OBV",
                        DataName = "obv",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Parabolic SAR
            new ChartListing {
                Name = "Parabolic Stop and Reverse (SAR)",
                Uiid = "PSAR",
                LegendTemplate = "PSAR([P1],[P2])",
                Endpoint = $"{baseUrl}/PSAR/",

                Results = [
                    new() {
                        TooltipTemplate = "PSAR([P1],[P2])",
                        DataName = "sar",
                        LineType = "dots",
                        LineWidth = 2,
                        DefaultColor = ChartColors.StandardPurple
                    }
                ]
            },

            // Percentage Volume Oscillator (PVO)
            new ChartListing {
                Name = "Percentage Volume Oscillator (PVO)",
                Uiid = "PVO",
                LegendTemplate = "PVO([P1],[P2],[P3])",
                Endpoint = $"{baseUrl}/PVO/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 0,
                            Color = ChartColors.ThresholdGrayTransparent,
                            Style = "dash"
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "PVO([P1],[P2],[P3])",
                        DataName = "pvo",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    },
                    new() {
                        TooltipTemplate = "PVO Signal",
                        DataName = "signal",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardRed
                    },
                    new() {
                        TooltipTemplate = "PVO Histogram",
                        DataName = "histogram",
                        LineType = "bar",
                        DefaultColor = ChartColors.StandardGrayTransparent
                    }
                ]
            },

            // Pivot Points (monthly window)
            new ChartListing {
                Name = "Pivot Points (month)",
                Uiid = "PIVOT-POINTS",
                LegendTemplate = "PIVOT POINTS(MONTH)",
                Endpoint = $"{baseUrl}/PIVOT-POINTS/",
                Category = "price-channel",
                Order = Order.BehindPrice,
                Results = [
                    new() {
                        DisplayName = "R3",
                        TooltipTemplate = "Resistance 3",
                        DataName = "r3",
                        LineType = "dash",
                        LineWidth = 1,
                        Segmented = true,
                        SegmentMode = "step",
                        DefaultColor = ChartColors.StandardRed
                    },
                    new() {
                        DisplayName = "R2",
                        TooltipTemplate = "Resistance 2",
                        DataName = "r2",
                        LineType = "dash",
                        LineWidth = 1,
                        Segmented = true,
                        SegmentMode = "step",
                        DefaultColor = ChartColors.StandardRed
                    },
                    new() {
                        DisplayName = "R1",
                        TooltipTemplate = "Resistance 1",
                        DataName = "r1",
                        LineType = "dash",
                        LineWidth = 1,
                        Segmented = true,
                        SegmentMode = "step",
                        DefaultColor = ChartColors.StandardRed
                    },
                    new() {
                        TooltipTemplate = "Pivot Point",
                        DataName = "pp",
                        LineType = "solid",
                        LineWidth = 1,
                        Segmented = true,
                        SegmentMode = "step",
                        DefaultColor = ChartColors.DarkGray
                    },
                    new() {
                        DisplayName = "S1",
                        TooltipTemplate = "Support 1",
                        DataName = "s1",
                        LineType = "dash",
                        LineWidth = 1,
                        Segmented = true,
                        SegmentMode = "step",
                        DefaultColor = ChartColors.StandardGreen
                    },
                    new() {
                        DisplayName = "S2",
                        TooltipTemplate = "Support 2",
                        DataName = "s2",
                        LineType = "dash",
                        LineWidth = 1,
                        Segmented = true,
                        SegmentMode = "step",
                        DefaultColor = ChartColors.StandardGreen
                    },
                    new() {
                        DisplayName = "S3",
                        TooltipTemplate = "Support 3",
                        DataName = "s3",
                        LineType = "dash",
                        LineWidth = 1,
                        Segmented = true,
                        SegmentMode = "step",
                        DefaultColor = ChartColors.StandardGreen
                    }
                ]
            },

            // Pivots
            new ChartListing {
                Uiid = "PIVOTS",
                LegendTemplate = "PIVOTS([P1],[P2],[P3])",
                Endpoint = $"{baseUrl}/PIVOTS/",
                Category = "price-pattern",
                Order = Order.Front,
                Results = [
                    new() {
                        TooltipTemplate = "High Point",
                        DataName = "highPoint",
                        LineType = "dots",
                        LineWidth = 3,
                        DefaultColor = ChartColors.StandardRed
                    },
                    new() {
                        TooltipTemplate = "Low Point",
                        DataName = "lowPoint",
                        LineType = "dots",
                        LineWidth = 3,
                        DefaultColor = ChartColors.StandardGreen
                    },
                    new() {
                        DisplayName = "High Trend Line",
                        TooltipTemplate = "High Trend Line",
                        DataName = "highLine",
                        LineType = "dash",
                        DefaultColor = ChartColors.StandardRed
                    },
                    new() {
                        DisplayName = "Low Trend Line",
                        TooltipTemplate = "Low Trend Line",
                        DataName = "lowLine",
                        LineType = "dash",
                        DefaultColor = ChartColors.StandardGreen
                    }
                ]
            },

            // Price Momentum Oscillator (PMO)
            new ChartListing {
                Name = "Price Momentum Oscillator (PMO)",
                Uiid = "PMO",
                LegendTemplate = "PMO([P1],[P2],[P3])",
                Endpoint = $"{baseUrl}/PMO/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 0,
                            Color = ChartColors.ThresholdGrayTransparent,
                            Style = "dash"
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "PMO([P1],[P2],[P3])",
                        DataName = "pmo",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    },
                    new() {
                        TooltipTemplate = "PMO Signal",
                        DataName = "signal",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardRed
                    }
                ]
            },

            // Price Relative Strength (PRS)
            // Charts prsPercent, not the raw prs ratio: percent change over the
            // lookback is comparable across time, where the ratio's level
            // depends on the two securities' absolute prices.
            new ChartListing {
                Name = "Price Relative Strength (vs SPY)",
                Uiid = "PRS",
                LegendTemplate = "PRS([P1])",
                Endpoint = $"{baseUrl}/PRS/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        // Above zero outperforms the benchmark over the lookback.
                        new() {
                            Value = 0,
                            Color = ChartColors.ThresholdGrayTransparent,
                            Style = "dash"
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "PRS %",
                        DataName = "prsPercent",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Bar transform: Median Price (HL2)
            new ChartListing {
                Name = "Median Price (HL2)",
                Uiid = "HL2",
                LegendTemplate = "HL2",
                Endpoint = $"{baseUrl}/HL2/",
                Results = [
                    new() {
                        DisplayName = "HL2",
                        TooltipTemplate = "HL2",
                        DataName = "value",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Bar transform: Typical Price (HLC3)
            new ChartListing {
                Name = "Typical Price (HLC3)",
                Uiid = "HLC3",
                LegendTemplate = "HLC3",
                Endpoint = $"{baseUrl}/HLC3/",
                Results = [
                    new() {
                        DisplayName = "HLC3",
                        TooltipTemplate = "HLC3",
                        DataName = "value",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Bar transform: Open-Close Average (OC2)
            new ChartListing {
                Name = "Open-Close Average (OC2)",
                Uiid = "OC2",
                LegendTemplate = "OC2",
                Endpoint = $"{baseUrl}/OC2/",
                Results = [
                    new() {
                        DisplayName = "OC2",
                        TooltipTemplate = "OC2",
                        DataName = "value",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Bar transform: Open-High-Low Average (OHL3)
            new ChartListing {
                Name = "Open-High-Low Average (OHL3)",
                Uiid = "OHL3",
                LegendTemplate = "OHL3",
                Endpoint = $"{baseUrl}/OHL3/",
                Results = [
                    new() {
                        DisplayName = "OHL3",
                        TooltipTemplate = "OHL3",
                        DataName = "value",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Bar transform: Average Price (OHLC4)
            new ChartListing {
                Name = "Average Price (OHLC4)",
                Uiid = "OHLC4",
                LegendTemplate = "OHLC4",
                Endpoint = $"{baseUrl}/OHLC4/",
                Results = [
                    new() {
                        DisplayName = "OHLC4",
                        TooltipTemplate = "OHLC4",
                        DataName = "value",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Rate of Change
            new ChartListing {
                Uiid = "ROC",
                LegendTemplate = "ROC([P1])",
                Endpoint = $"{baseUrl}/ROC/",
                Results = [
                    new() {
                        DisplayName = "Rate of Change",
                        TooltipTemplate = "ROC([P1])",
                        DataName = "roc",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Rate of Change with Bands
            new ChartListing {
                Name = "Rate of Change with Bands",
                Uiid = "ROCWB",
                LegendTemplate = "ROCWB([P1],[P2],[P3])",
                Endpoint = $"{baseUrl}/ROCWB/",
                Category = "oscillator",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 0,
                            Color = ChartColors.ThresholdGrayTransparent,
                            Style = "dash"
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "ROCWB([P1],[P2],[P3])",
                        DataName = "roc",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    },
                    new() {
                        TooltipTemplate = "ROCWB EMA",
                        DataName = "rocEma",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardOrange
                    },
                    new() {
                        TooltipTemplate = "ROCWB Upper Band",
                        DataName = "upperBand",
                        LineType = "dash",
                        DefaultColor = ChartColors.StandardRed
                    },
                    new() {
                        TooltipTemplate = "ROCWB Lower Band",
                        DataName = "lowerBand",
                        LineType = "dash",
                        DefaultColor = ChartColors.StandardGreen
                    }
                ]
            },

            // Relative Strength Index
            new ChartListing {
                Name = "Relative Strength Index (RSI)",
                Uiid = "RSI",
                LegendTemplate = "RSI([P1])",
                Endpoint = $"{baseUrl}/RSI/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 70,
                            Color = ChartColors.ThresholdRed,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+2",
                                ColorAbove = "transparent",
                                ColorBelow = ChartColors.ThresholdGreen
                            }
                        },
                        new() {
                            Value = 30,
                            Color = ChartColors.ThresholdGreen,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+1",
                                ColorAbove = ChartColors.ThresholdRed,
                                ColorBelow = "transparent"
                            }
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "RSI([P1])",
                        DataName = "rsi",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Rolling Pivot Points
            new ChartListing {
                Name = "Rolling Pivot Points",
                Uiid = "ROLLING-PIVOTS",
                LegendTemplate = "ROLLING PIVOTS([P1],[P2])",
                Endpoint = $"{baseUrl}/ROLLING-PIVOTS/",
                Category = "price-channel",
                Order = Order.BehindPrice,
                Results = [
                    new() {
                        DisplayName = "R3",
                        TooltipTemplate = "Resistance 3",
                        DataName = "r3",
                        LineType = "dash",
                        LineWidth = 1,
                        DefaultColor = ChartColors.StandardRed
                    },
                    new() {
                        DisplayName = "R2",
                        TooltipTemplate = "Resistance 2",
                        DataName = "r2",
                        LineType = "dash",
                        LineWidth = 1,
                        DefaultColor = ChartColors.StandardRed
                    },
                    new() {
                        DisplayName = "R1",
                        TooltipTemplate = "Resistance 1",
                        DataName = "r1",
                        LineType = "dash",
                        LineWidth = 1,
                        DefaultColor = ChartColors.StandardRed
                    },
                    new() {
                        TooltipTemplate = "Pivot Point",
                        DataName = "pp",
                        LineType = "solid",
                        LineWidth = 1,
                        DefaultColor = ChartColors.StandardBlue
                    },
                    new() {
                        DisplayName = "S1",
                        TooltipTemplate = "Support 1",
                        DataName = "s1",
                        LineType = "dash",
                        LineWidth = 1,
                        DefaultColor = ChartColors.StandardGreen
                    },
                    new() {
                        DisplayName = "S2",
                        TooltipTemplate = "Support 2",
                        DataName = "s2",
                        LineType = "dash",
                        LineWidth = 1,
                        DefaultColor = ChartColors.StandardGreen
                    },
                    new() {
                        DisplayName = "S3",
                        TooltipTemplate = "Support 3",
                        DataName = "s3",
                        LineType = "dash",
                        LineWidth = 1,
                        DefaultColor = ChartColors.StandardGreen
                    }
                ]
            },

            // Schaff Trend Cycle (STC)
            new ChartListing {
                Name = "Schaff Trend Cycle (STC)",
                Uiid = "STC",
                LegendTemplate = "STC([P1],[P2],[P3])",
                Endpoint = $"{baseUrl}/STC/",
                ChartConfig = new ChartConfig {
                    MinimumYAxis = 0,
                    MaximumYAxis = 100,

                    Thresholds =
                    [
                        new() {
                            Value = 75,
                            Color = ChartColors.ThresholdGreen,
                            Style = "solid",
                            Fill = new ChartFill {
                                Target = "+2",
                                ColorAbove = "transparent",
                                ColorBelow = ChartColors.ThresholdGreen
                            }
                        },
                        new() {
                            Value = 25,
                            Color = ChartColors.ThresholdRed,
                            Style = "solid",
                            Fill = new ChartFill {
                                Target = "+1",
                                ColorAbove = ChartColors.ThresholdRed,
                                ColorBelow = "transparent"
                            }
                        }
                    ]
                },
                Results = [
                    new() {
                        DisplayName = "Schaff Trend Cycle",
                        TooltipTemplate = "Schaff Trend Cycle",
                        DataName = "stc",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Simple Moving Average
            new ChartListing {
                Name = "Simple Moving Average (SMA)",
                Uiid = "SMA",
                LegendTemplate = "SMA([P1])",
                Endpoint = $"{baseUrl}/SMA/",
                Results = [
                    new() {
                        TooltipTemplate = "SMA([P1])",
                        DataName = "sma",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // SMA Analysis — one listing per error metric. MAD (dollars),
            // MSE (dollars²), and MAPE (fraction) have incompatible units, so
            // charting them together flattens the smaller series into
            // unreadable lines (#475). All three share the SMA-ANALYSIS
            // endpoint and select a single metric from its response.
            new ChartListing {
                Name = "SMA Error Analysis (MAD)",
                Uiid = "SMA-MAD",
                LegendTemplate = "SMA-MAD([P1])",
                Endpoint = $"{baseUrl}/SMA-ANALYSIS/",
                Results = [
                    new() {
                        DisplayName = "Mean Absolute Deviation",
                        TooltipTemplate = "SMA-MAD([P1])",
                        DataName = "mad",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            new ChartListing {
                Name = "SMA Error Analysis (MAPE)",
                Uiid = "SMA-MAPE",
                LegendTemplate = "SMA-MAPE([P1])",
                Endpoint = $"{baseUrl}/SMA-ANALYSIS/",
                Results = [
                    new() {
                        DisplayName = "Mean Absolute Percentage Error",
                        TooltipTemplate = "SMA-MAPE([P1])",
                        DataName = "mape",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            new ChartListing {
                Name = "SMA Error Analysis (MSE)",
                Uiid = "SMA-MSE",
                LegendTemplate = "SMA-MSE([P1])",
                Endpoint = $"{baseUrl}/SMA-ANALYSIS/",
                Results = [
                    new() {
                        DisplayName = "Mean Squared Error",
                        TooltipTemplate = "SMA-MSE([P1])",
                        DataName = "mse",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Slope
            new ChartListing {
                Uiid = "SLOPE",
                LegendTemplate = "SLOPE([P1])",
                Endpoint = $"{baseUrl}/SLOPE/",
                Results = [
                    new() {
                        TooltipTemplate = "SLOPE([P1])",
                        DataName = "slope",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Smoothed Moving Average (SMMA)
            new ChartListing {
                Name = "Smoothed Moving Average (SMMA)",
                Uiid = "SMMA",
                LegendTemplate = "SMMA([P1])",
                Endpoint = $"{baseUrl}/SMMA/",
                Results = [
                    new() {
                        TooltipTemplate = "SMMA([P1])",
                        DataName = "smma",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Standard Deviation (absolute)
            new ChartListing {
                Name = "Standard Deviation (absolute)",
                Uiid = "STDEV",
                LegendTemplate = "STDEV([P1])",
                Endpoint = $"{baseUrl}/STDEV/",
                Results = [
                    new() {
                        DisplayName = "Standard Deviation",
                        TooltipTemplate = "STDEV([P1])",
                        DataName = "stdDev",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Standard Deviation (z-score)
            new ChartListing {
                Name = "Standard Deviation (Z-Score)",
                Uiid = "STDEV-ZSCORE",
                LegendTemplate = "STDEV-ZSCORE([P1])",
                Endpoint = $"{baseUrl}/STDEV/",
                ChartType = "oscillator",
                Results = [
                    new() {
                        DisplayName = "Z-Score",
                        TooltipTemplate = "Z-Score([P1])",
                        DataName = "zScore",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Standard Deviation Channels
            new ChartListing {
                Uiid = "STDEV-CH",
                LegendTemplate = "STDEV-CH([P1],[P2])",
                Endpoint = $"{baseUrl}/STDEV-CH/",
                Order = Order.BehindPrice,
                Results = [
                    new() {
                        TooltipTemplate = "STDEV-CH Upper",
                        DataName = "upperChannel",
                        LineType = "solid",
                        LineWidth = 1,
                        Segmented = true,
                        SegmentMode = "slope",
                        DefaultColor = ChartColors.StandardOrange,
                        Fill = new ChartFill {
                            Target = "+2",
                            ColorAbove = ChartColors.DarkGrayTransparent,
                            ColorBelow = ChartColors.DarkGrayTransparent
                        }
                    },
                    new() {
                        TooltipTemplate = "STDEV-CH Centerline",
                        DataName = "centerline",
                        LineType = "dash",
                        LineWidth = 1,
                        Segmented = true,
                        SegmentMode = "slope",
                        DefaultColor = ChartColors.StandardOrange
                    },
                    new() {
                        TooltipTemplate = "STDEV-CH Lower",
                        DataName = "lowerChannel",
                        LineType = "solid",
                        LineWidth = 1,
                        Segmented = true,
                        SegmentMode = "slope",
                        DefaultColor = ChartColors.StandardOrange
                    }
                ]
            },

            // STARC Bands
            new ChartListing {
                Uiid = "STARC",
                LegendTemplate = "STARC([P1],[P2],[P3])",
                Endpoint = $"{baseUrl}/STARC/",
                Order = Order.BehindPrice,
                Results = MetadataHelpers.GetPriceBandResults("STARC", ChartColors.StandardOrange)
            },

            // Stochastic Momentum Index
            new ChartListing {
                Uiid = "SMI",
                LegendTemplate = "SMI([P1],[P2],[P3],[P4])",
                Endpoint = $"{baseUrl}/SMI/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 40,
                            Color = ChartColors.ThresholdRed,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+2",
                                ColorAbove = "transparent",
                                ColorBelow = ChartColors.ThresholdGreen
                            }
                        },
                        new() {
                            Value = -40,
                            Color = ChartColors.ThresholdGreen,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+1",
                                ColorAbove = ChartColors.ThresholdRed,
                                ColorBelow = "transparent"
                            }
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "SMI",
                        DataName = "smi",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    },
                    new() {
                        TooltipTemplate = "Signal",
                        DataName = "signal",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardRed
                    }
                ]
            },

            // Stochastic Oscillator
            new ChartListing {
                Uiid = "STO",
                LegendTemplate = "STOCH %K([P1]) %D([P2])",
                Endpoint = $"{baseUrl}/STO/",
                ChartType = "oscillator",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 80,
                            Color = ChartColors.ThresholdRed,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+2",
                                ColorAbove = "transparent",
                                ColorBelow = ChartColors.ThresholdGreen
                            }
                        },
                        new() {
                            Value = 20,
                            Color = ChartColors.ThresholdGreen,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+1",
                                ColorAbove = ChartColors.ThresholdRed,
                                ColorBelow = "transparent"
                            }
                        }
                    ]
                },
                Results = [
                    new() {
                        DisplayName = "%K",
                        TooltipTemplate = "STO %K([P1])",
                        DataName = "k",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    },
                    new() {
                        DisplayName = "%D",
                        TooltipTemplate = "STO %D([P2])",
                        DataName = "d",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardRed
                    }
                ]
            },

            // Stochastic RSI
            new ChartListing {
                Uiid = "STOCHRSI",
                LegendTemplate = "STOCH-RSI ([P1],[P2],[P3],[P4])",
                Endpoint = $"{baseUrl}/STORSI/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 80,
                            Color = ChartColors.ThresholdRed,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+2",
                                ColorAbove = "transparent",
                                ColorBelow = ChartColors.ThresholdGreen
                            }
                        },
                        new() {
                            Value = 20,
                            Color = ChartColors.ThresholdGreen,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+1",
                                ColorAbove = ChartColors.ThresholdRed,
                                ColorBelow = "transparent"
                            }
                        }
                    ]
                },
                Results = [
                    new() {
                        DisplayName = "Oscillator",
                        TooltipTemplate = "StochRSI Oscillator",
                        DataName = "stochRsi",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    },
                    new() {
                        DisplayName = "Signal line",
                        TooltipTemplate = "Signal line",
                        DataName = "signal",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardRed
                    }
                ]
            },

            // SuperTrend
            new ChartListing {
                Uiid = "SUPERTREND",
                LegendTemplate = "SUPERTREND([P1],[P2])",
                Endpoint = $"{baseUrl}/SUPERTREND/",
                Order = Order.Front,
                Results = [
                    new() {
                        TooltipTemplate = "SUPERTREND([P1],[P2]) Upper Band",
                        DataName = "upperBand",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardRed
                    },
                    new() {
                        TooltipTemplate = "SUPERTREND([P1],[P2]) Lower Band",
                        DataName = "lowerBand",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardGreen
                    },
                    new() {
                        DisplayName = "Transition line",
                        TooltipTemplate = "SUPERTREND([P1],[P2]) Transition Line",
                        DataName = "superTrend",
                        LineType = "dash",
                        LineWidth = 1,
                        DefaultColor = ChartColors.DarkGrayTransparent
                    }
                ]
            },

            // Tillson T3 Moving Average
            new ChartListing {
                Name = "Tillson T3 Moving Average",
                Uiid = "T3",
                LegendTemplate = "T3([P1],[P2])",
                Endpoint = $"{baseUrl}/T3/",
                Results = [
                    new() {
                        TooltipTemplate = "T3([P1],[P2])",
                        DataName = "t3",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Triple Exponential Moving Average (TEMA)
            new ChartListing {
                Name = "Triple Exponential Moving Average (TEMA)",
                Uiid = "TEMA",
                LegendTemplate = "TEMA([P1])",
                Endpoint = $"{baseUrl}/TEMA/",
                Results = [
                    new() {
                        TooltipTemplate = "TEMA([P1])",
                        DataName = "tema",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // TRIX Oscillator
            new ChartListing {
                Name = "TRIX Oscillator",
                Uiid = "TRIX",
                LegendTemplate = "TRIX([P1])",
                Endpoint = $"{baseUrl}/TRIX/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 0,
                            Color = ChartColors.ThresholdGrayTransparent,
                            Style = "dash"
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "TRIX([P1])",
                        DataName = "trix",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // True Range
            new ChartListing {
                Uiid = "TR",
                LegendTemplate = "TR",
                Endpoint = $"{baseUrl}/TR/",
                Results = [
                    new() {
                        TooltipTemplate = "TR",
                        DataName = "tr",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // True Strength Index (TSI)
            new ChartListing {
                Name = "True Strength Index (TSI)",
                Uiid = "TSI",
                LegendTemplate = "TSI([P1],[P2],[P3])",
                Endpoint = $"{baseUrl}/TSI/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 25,
                            Color = ChartColors.ThresholdRed,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+2",
                                ColorAbove = "transparent",
                                ColorBelow = ChartColors.ThresholdGreen
                            }
                        },
                        new() {
                            Value = -25,
                            Color = ChartColors.ThresholdGreen,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+1",
                                ColorAbove = ChartColors.ThresholdRed,
                                ColorBelow = "transparent"
                            }
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "TSI([P1],[P2],[P3])",
                        DataName = "tsi",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    },
                    new() {
                        TooltipTemplate = "TSI Signal",
                        DataName = "signal",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardRed
                    }
                ]
            },

            // Ulcer Index
            new ChartListing {
                Name = "Ulcer Index (UI)",
                Uiid = "ULCER",
                LegendTemplate = "ULCER([P1])",
                Endpoint = $"{baseUrl}/ULCER/",
                ChartType = "oscillator",
                Results = [
                    new() {
                        DisplayName = "Ulcer Index",
                        TooltipTemplate = "UI([P1])",
                        DataName = "ui",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Ultimate Oscillator
            new ChartListing {
                Uiid = "ULTIMATE",
                LegendTemplate = "ULTIMATE([P1],[P2],[P3])",
                Endpoint = $"{baseUrl}/ULTIMATE/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = 70,
                            Color = ChartColors.ThresholdRed,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+2",
                                ColorAbove = "transparent",
                                ColorBelow = ChartColors.ThresholdGreen
                            }
                        },
                        new() {
                            Value = 30,
                            Color = ChartColors.ThresholdGreen,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+1",
                                ColorAbove = ChartColors.ThresholdRed,
                                ColorBelow = "transparent"
                            }
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "ULTIMATE([P1],[P2],[P3])",
                        DataName = "ultimate",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Volatility Stop
            new ChartListing {
                Uiid = "VOL-STOP",
                LegendTemplate = "VOL-STOP([P1],[P2])",
                Endpoint = $"{baseUrl}/VOL-STOP/",
                ChartType = "overlay",
                Order = Order.Front,
                Results = [
                    new() {
                        DisplayName = "Upper Band",
                        TooltipTemplate = "VOL-STOP([P1],[P2]) Upper Band",
                        DataName = "upperBand",
                        LineType = "dots",
                        LineWidth = 2,
                        DefaultColor = ChartColors.StandardRed
                    },
                    new() {
                        DisplayName = "Lower Band",
                        TooltipTemplate = "VOL-STOP([P1],[P2]) Lower Band",
                        DataName = "lowerBand",
                        LineType = "dots",
                        LineWidth = 2,
                        DefaultColor = ChartColors.StandardGreen
                    }
                ]
            },

            // VWAP anchored to the first visible bar, not reset per session.
            // The modifier names the anchor so a future session variant can be
            // "VWAP (session)" beside it (#491)
            new ChartListing {
                Name = "Volume Weighted Average Price (VWAP), visible range",
                Uiid = "VWAP",
                LegendTemplate = "VWAP (visible range)",
                Endpoint = $"{baseUrl}/VWAP/",
                Category = "moving-average",
                Results = [
                    new() {
                        DisplayName = "VWAP (visible range)",
                        TooltipTemplate = "VWAP (visible range)",
                        DataName = "vwap",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Volume Weighted Moving Average (VWMA)
            new ChartListing {
                Name = "Volume Weighted Moving Average (VWMA)",
                Uiid = "VWMA",
                LegendTemplate = "VWMA([P1])",
                Endpoint = $"{baseUrl}/VWMA/",
                Results = [
                    new() {
                        TooltipTemplate = "VWMA([P1])",
                        DataName = "vwma",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Vortex Indicator
            new ChartListing {
                Uiid = "VORTEX",
                LegendTemplate = "VORTEX([P1])",
                Endpoint = $"{baseUrl}/VORTEX/",
                Results = [
                    new() {
                        TooltipTemplate = "VI+",
                        DataName = "pvi",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardGreen
                    },
                    new() {
                        TooltipTemplate = "VI-",
                        DataName = "nvi",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardRed
                    }
                ]
            },

            // Weighted Moving Average (WMA)
            new ChartListing {
                Name = "Weighted Moving Average (WMA)",
                Uiid = "WMA",
                LegendTemplate = "WMA([P1])",
                Endpoint = $"{baseUrl}/WMA/",
                Results = [
                    new() {
                        TooltipTemplate = "WMA([P1])",
                        DataName = "wma",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Williams %R
            new ChartListing {
                Uiid = "WILLIAMSR",
                LegendTemplate = "Williams %R([P1])",
                Endpoint = $"{baseUrl}/WILLIAMSR/",
                ChartConfig = new ChartConfig {
                    Thresholds =
                    [
                        new() {
                            Value = -20,
                            Color = ChartColors.ThresholdRed,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+2",
                                ColorAbove = "transparent",
                                ColorBelow = ChartColors.ThresholdGreen
                            }
                        },
                        new() {
                            Value = -80,
                            Color = ChartColors.ThresholdGreen,
                            Style = "dash",
                            Fill = new ChartFill {
                                Target = "+1",
                                ColorAbove = ChartColors.ThresholdRed,
                                ColorBelow = "transparent"
                            }
                        }
                    ]
                },
                Results = [
                    new() {
                        TooltipTemplate = "Williams %R([P1])",
                        DataName = "williamsR",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    }
                ]
            },

            // Williams Alligator
            new ChartListing {
                Uiid = "ALLIGATOR",
                LegendTemplate = "ALLIGATOR([P1],[P2],[P3],[P4],[P5],[P6])",
                Endpoint = $"{baseUrl}/ALLIGATOR/",
                Results = [
                    new() {
                        TooltipTemplate = "Jaw([P1]/[P2])",
                        DataName = "jaw",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    },
                    new() {
                        TooltipTemplate = "Teeth([P3]/[P4])",
                        DataName = "teeth",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardRed
                    },
                    new() {
                        TooltipTemplate = "Lips([P4]/[P5])",
                        DataName = "lips",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardGreen
                    }
                ]
            },

            // Zig Zag (close)
            new ChartListing {
                Name = "Zig Zag (close)",
                Uiid = "ZIGZAG-CL",
                LegendTemplate = "ZIGZAG([P1]% CLOSE)",
                Endpoint = $"{baseUrl}/ZIGZAG-CLOSE/",
                Results = [
                    new() {
                        TooltipTemplate = "ZIGZAG([P1]% CLOSE)",
                        DataName = "zigZag",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    },
                    new() {
                        DisplayName = "Zig Zag Retrace High",
                        TooltipTemplate = "ZIGZAG([P1]% CLOSE) Retrace High",
                        DataName = "retraceHigh",
                        LineType = "dash",
                        DefaultColor = ChartColors.ThresholdGrayTransparent
                    },
                    new() {
                        DisplayName = "Zig Zag Retrace Low",
                        TooltipTemplate = "ZIGZAG([P1]% CLOSE) Retrace Low",
                        DataName = "retraceLow",
                        LineType = "dash",
                        DefaultColor = ChartColors.ThresholdGrayTransparent
                    }
                ]
            },

            // Zig Zag (high/low)
            new ChartListing {
                Name = "Zig Zag (high/low)",
                Uiid = "ZIGZAG-HL",
                LegendTemplate = "ZIGZAG([P1]% HIGH/LOW)",
                Endpoint = $"{baseUrl}/ZIGZAG-HIGHLOW/",
                Results = [
                    new() {
                        TooltipTemplate = "ZIGZAG([P1]% HIGH/LOW)",
                        DataName = "zigZag",
                        LineType = "solid",
                        DefaultColor = ChartColors.StandardBlue
                    },
                    new() {
                        DisplayName = "Zig Zag Retrace High",
                        TooltipTemplate = "ZIGZAG([P1]% HIGH/LOW) Retrace High",
                        DataName = "retraceHigh",
                        LineType = "dash",
                        DefaultColor = ChartColors.ThresholdGrayTransparent
                    },
                    new() {
                        DisplayName = "Zig Zag Retrace Low",
                        TooltipTemplate = "ZIGZAG([P1]% HIGH/LOW) Retrace Low",
                        DataName = "retraceLow",
                        LineType = "dash",
                        DefaultColor = ChartColors.ThresholdGrayTransparent
                    }
                ]
            },
        ];

        return listing;
    }
}
