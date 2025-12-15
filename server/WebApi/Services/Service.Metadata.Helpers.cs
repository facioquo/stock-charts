namespace WebApi.Services;

public static class MetadataHelpers
{
    // Overload chain replaces optional parameters to satisfy S2360 (explicit intent per variant)
    public static ChartConfig GetOscillatorConfig()
        => GetOscillatorConfig(0, 100);

    public static ChartConfig GetOscillatorConfig(float min, float max)
        => GetOscillatorConfig(min, max, 80); // default upper

    public static ChartConfig GetOscillatorConfig(float min, float max, float upperThreshold)
        => GetOscillatorConfig(min, max, upperThreshold, 20); // default lower

    public static ChartConfig GetOscillatorConfig(float min, float max, float upperThreshold, float lowerThreshold)
        => new() {
            MinimumYAxis = min,
            MaximumYAxis = max,
            Thresholds = [
                new() {
                    Value = upperThreshold,
                    Color = ChartColors.ThresholdRed,
                    Style = "dash",
                    Fill = new() {
                        Target = "+2",
                        ColorAbove = "transparent",
                        ColorBelow = ChartColors.ThresholdGreen
                    }
                },
                new() {
                    Value = lowerThreshold,
                    Color = ChartColors.ThresholdGreen,
                    Style = "dash",
                    Fill = new() {
                        Target = "+1",
                        ColorAbove = ChartColors.ThresholdRed,
                        ColorBelow = "transparent"
                    }
                }
            ]
        };

    public static List<IndicatorResultConfig> GetPriceBandResults(string name)
        => GetPriceBandResults(name, ChartColors.StandardOrange);

    public static List<IndicatorResultConfig> GetPriceBandResults(string name, string color)
        => [
            new IndicatorResultConfig {
                DisplayName = "Upper Band",
                TooltipTemplate = $"{name} Upper Band",
                DataName = "upperBand",
                DataType = "number",
                LineType = "solid",
                LineWidth = 1,
                DefaultColor = color,
                Fill = new() {
                    Target = "+2",
                    ColorAbove = ChartColors.DarkGrayTransparent,
                    ColorBelow = ChartColors.DarkGrayTransparent
                }
            },
            new() {
                DisplayName = "Centerline",
                TooltipTemplate = $"{name} Centerline",
                DataName = "centerline",
                DataType = "number",
                LineType = "dash",
                LineWidth = 1,
                DefaultColor = color
            },
            new() {
                DisplayName = "Lower Band",
                TooltipTemplate = $"{name} Lower Band",
                DataName = "lowerBand",
                DataType = "number",
                LineType = "solid",
                LineWidth = 1,
                DefaultColor = color
            }
        ];
}

