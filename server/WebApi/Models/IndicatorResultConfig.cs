using System.Text.Json.Serialization;

namespace WebApi.Models;

[Serializable]
public record IndicatorResultConfig
{
    public required string DisplayName { get; init; }
    public required string TooltipTemplate { get; init; }
    public required string DataName { get; init; }
    public required string DataType { get; init; }
    public required string LineType { get; init; }

    /// <summary>
    /// Marks a piecewise-constant level line (e.g. weekly Pivot Points) whose
    /// value is flat within a window and steps at each window boundary. The
    /// client renders each window as a separate horizontal segment by hiding the
    /// boundary riser, rather than drawing a continuous stepped line. Omitted
    /// from serialization when false to keep the listing snapshot lean.
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public bool Segmented { get; init; }

    public string? Stack { get; set; }
    public float LineWidth { get; set; } = 2;
    public required string DefaultColor { get; init; }
    public ChartFill? Fill { get; set; }
}
