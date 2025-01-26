namespace WebApi.Models;

[Serializable]
public record ChartFill
{
    public required string Target { get; init; }
    public required string ColorAbove { get; init; }
    public required string ColorBelow { get; init; }
}
