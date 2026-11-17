namespace WebApi.Models;

/// <summary>
/// How the demo draws one result of a library catalog listing, matched to it by <see cref="DataName"/>.
/// </summary>
public record ChartResult
{
    public required string DataName { get; init; }

    /// <summary>
    /// Replaces the library's display name. Required for a result the library does not list.
    /// </summary>
    public string? DisplayName { get; init; }

    public required string TooltipTemplate { get; init; }
    public required string LineType { get; init; }

    /// <inheritdoc cref="IndicatorResultConfig.Segmented"/>
    public bool Segmented { get; init; }

    /// <inheritdoc cref="IndicatorResultConfig.SegmentMode"/>
    public string? SegmentMode { get; init; }

    public string? Stack { get; init; }
    public float LineWidth { get; init; } = 2;
    public required string DefaultColor { get; init; }
    public ChartFill? Fill { get; init; }
}
