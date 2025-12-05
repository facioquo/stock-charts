namespace WebApi.Tests.Services;

public class QuoteFileFallbackTests
{
    [Fact]
    public void ReturnsData()
    {
        IReadOnlyList<Quote> data = QuoteFileFallback.Get();
        Assert.NotNull(data);
        Assert.True(data.Count > 0);
    }

    [Fact]
    public void IsOrderedByDate()
    {
        IReadOnlyList<Quote> data = QuoteFileFallback.Get();
        List<Quote> ordered = data.OrderBy(q => q.Date).ToList();
        Assert.Equal(ordered.Count, data.Count);
        for (int i = 0; i < data.Count; i++)
        {
            Assert.Equal(ordered[i].Date, data[i].Date);
        }
    }
}
