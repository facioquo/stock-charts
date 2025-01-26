namespace WebApi.Models;

[Serializable]
public record ChartThreshold
{
    public required double Value { get; init; }
    public required string Color { get; init; }
    public required string Style { get; init; }
    public ChartFill? Fill { get; set; }
}
