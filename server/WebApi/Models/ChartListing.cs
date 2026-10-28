namespace WebApi.Models;

/// <summary>
/// How the demo charts a library catalog listing. <see cref="Services.LibraryCatalog"/> extends
/// the library's listing with it to build the <see cref="IndicatorListing"/> the API serves.
/// </summary>
/// <remarks>
/// Set a name, category, or chart type only where the demo differs from the library,
/// such as one variant of a listing the demo charts several ways.
/// </remarks>
public record ChartListing
{
    public required string Uiid { get; init; }
    public required string LegendTemplate { get; init; }
    public required string Endpoint { get; init; }

    /// <summary>
    /// Replaces the library's name.
    /// </summary>
    public string? Name { get; init; }

    /// <summary>
    /// Replaces the library's category.
    /// </summary>
    public string? Category { get; init; }

    /// <summary>
    /// Replaces the chart type the library's chart panes give: overlay when every result
    /// draws on price, oscillator otherwise.
    /// </summary>
    public string? ChartType { get; init; }

    public Order Order { get; init; } = Order.Front;

    /// <summary>
    /// The pane's axis range and thresholds. An axis bound left unset comes from the
    /// library's pane, when it lists one.
    /// </summary>
    public ChartConfig? ChartConfig { get; init; }

    public required ICollection<ChartResult> Results { get; init; }
}
