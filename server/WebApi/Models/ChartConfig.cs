namespace WebApi.Models;

[Serializable]
public record ChartConfig
{
    public double? MinimumYAxis { get; set; }
    public double? MaximumYAxis { get; set; }

    public ICollection<ChartThreshold>? Thresholds { get; set; }
}
