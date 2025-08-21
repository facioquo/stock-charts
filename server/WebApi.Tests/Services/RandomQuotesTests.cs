namespace WebApi.Tests.Services;

public class RandomQuotesTests
{
    [Fact]
    public void Constructor_InvalidBars_Throws()
    {
        // Arrange & Act & Assert
        ArgumentException exception = Assert.Throws<ArgumentException>(() => new RandomQuotes(bars: 0));
        Assert.Equal("bars", exception.ParamName);
        Assert.Contains("Number of bars must be greater than zero", exception.Message);

        // Test negative bars
        ArgumentException negativeException = Assert.Throws<ArgumentException>(() => new RandomQuotes(bars: -1));
        Assert.Equal("bars", negativeException.ParamName);
        Assert.Contains("Number of bars must be greater than zero", negativeException.Message);
    }

    [Fact]
    public void Constructor_InvalidVolatility_Throws()
    {
        // Arrange & Act & Assert
        ArgumentException exception = Assert.Throws<ArgumentException>(() => new RandomQuotes(volatility: 0));
        Assert.Equal("volatility", exception.ParamName);
        Assert.Contains("Volatility must be greater than zero", exception.Message);

        // Test negative volatility
        ArgumentException negativeException = Assert.Throws<ArgumentException>(() => new RandomQuotes(volatility: -0.5));
        Assert.Equal("volatility", negativeException.ParamName);
        Assert.Contains("Volatility must be greater than zero", negativeException.Message);
    }

    [Fact]
    public void Constructor_InvalidSeed_Throws()
    {
        // Arrange & Act & Assert
        ArgumentException exception = Assert.Throws<ArgumentException>(() => new RandomQuotes(seed: 0));
        Assert.Equal("seed", exception.ParamName);
        Assert.Contains("Seed must be greater than zero", exception.Message);

        // Test negative seed
        ArgumentException negativeException = Assert.Throws<ArgumentException>(() => new RandomQuotes(seed: -100));
        Assert.Equal("seed", negativeException.ParamName);
        Assert.Contains("Seed must be greater than zero", negativeException.Message);
    }

    [Fact]
    public void Constructor_ExcludeWeekends_InvalidFrequency_Throws()
    {
        // Arrange & Act & Assert - frequency too small (under 1 hour)
        ArgumentException smallFreqException = Assert.Throws<ArgumentException>(() =>
            new RandomQuotes(periodSize: PeriodSize.ThirtyMinutes, includeWeekends: false));
        Assert.Equal("includeWeekends", smallFreqException.ParamName);
        Assert.Contains("Weekends can only be excluded for period sizes between OneHour and OneWeek", smallFreqException.Message);

        // Test frequency too large (week or more)
        ArgumentException largeFreqException = Assert.Throws<ArgumentException>(() =>
            new RandomQuotes(periodSize: PeriodSize.Week, includeWeekends: false));
        Assert.Equal("includeWeekends", largeFreqException.ParamName);
        Assert.Contains("Weekends can only be excluded for period sizes between OneHour and OneWeek", largeFreqException.Message);
    }

    [Fact]
    public void Constructor_GeneratesRequestedCount()
    {
        // Arrange
        const int requestedBars = 100;

        // Act
        RandomQuotes quotes = new(bars: requestedBars);

        // Assert
        Assert.Equal(requestedBars, quotes.Count);
        Assert.All(quotes, quote => {
            Assert.True(quote.Open > 0);
            Assert.True(quote.High > 0);
            Assert.True(quote.Low > 0);
            Assert.True(quote.Close > 0);
            Assert.True(quote.Volume > 0);
            Assert.True(quote.High >= Math.Max(quote.Open, quote.Close));
            Assert.True(quote.Low <= Math.Min(quote.Open, quote.Close));
        });
    }

    [Fact]
    public void Constructor_ExcludeWeekends_RemovesWeekendBars()
    {
        // Arrange - Use a larger number to increase chances of hitting weekends
        const int requestedBars = 20;

        // Act
        RandomQuotes quotesWithWeekends = new(bars: requestedBars, periodSize: PeriodSize.Day, includeWeekends: true);
        RandomQuotes quotesWithoutWeekends = new(bars: requestedBars, periodSize: PeriodSize.Day, includeWeekends: false);

        // Assert
        Assert.Equal(requestedBars, quotesWithWeekends.Count);
        Assert.Equal(requestedBars, quotesWithoutWeekends.Count);

        // Verify no weekend dates when weekends are excluded
        Assert.All(quotesWithoutWeekends, quote => {
            Assert.True(quote.Date.DayOfWeek is not DayOfWeek.Saturday and not DayOfWeek.Sunday,
                $"Found weekend date {quote.Date:yyyy-MM-dd} ({quote.Date.DayOfWeek}) when weekends should be excluded");
        });
    }

    [Fact]
    public void Constructor_ValidatesHourlyFrequencyForWeekendExclusion()
    {
        // Arrange & Act - OneHour should be valid for weekend exclusion
        RandomQuotes quotes = new(bars: 5, periodSize: PeriodSize.OneHour, includeWeekends: false);

        // Assert
        Assert.Equal(5, quotes.Count);

        // TwoHours should also be valid
        RandomQuotes quotesTwo = new(bars: 5, periodSize: PeriodSize.TwoHours, includeWeekends: false);
        Assert.Equal(5, quotesTwo.Count);

        // Day should also be valid
        RandomQuotes quotesDaily = new(bars: 5, periodSize: PeriodSize.Day, includeWeekends: false);
        Assert.Equal(5, quotesDaily.Count);
    }
}
