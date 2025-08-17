namespace WebApi.Tests;

public class RandomQuotesTests
{
    [Fact]
    public void Constructor_InvalidBars_Throws()
    {
        // Arrange & Act & Assert
        var exception = Assert.Throws<ArgumentException>(() => new RandomQuotes(bars: 0));
        Assert.Equal("bars", exception.ParamName);
        Assert.Contains("Number of bars must be greater than zero", exception.Message);

        var exception2 = Assert.Throws<ArgumentException>(() => new RandomQuotes(bars: -5));
        Assert.Equal("bars", exception2.ParamName);
        Assert.Contains("Number of bars must be greater than zero", exception2.Message);
    }

    [Fact]
    public void Constructor_InvalidVolatility_Throws()
    {
        // Arrange & Act & Assert
        var exception = Assert.Throws<ArgumentException>(() => new RandomQuotes(volatility: 0));
        Assert.Equal("volatility", exception.ParamName);
        Assert.Contains("Volatility must be greater than zero", exception.Message);

        var exception2 = Assert.Throws<ArgumentException>(() => new RandomQuotes(volatility: -1.5));
        Assert.Equal("volatility", exception2.ParamName);
        Assert.Contains("Volatility must be greater than zero", exception2.Message);
    }

    [Fact]
    public void Constructor_InvalidSeed_Throws()
    {
        // Arrange & Act & Assert
        var exception = Assert.Throws<ArgumentException>(() => new RandomQuotes(seed: 0));
        Assert.Equal("seed", exception.ParamName);
        Assert.Contains("Seed must be greater than zero", exception.Message);

        var exception2 = Assert.Throws<ArgumentException>(() => new RandomQuotes(seed: -100));
        Assert.Equal("seed", exception2.ParamName);
        Assert.Contains("Seed must be greater than zero", exception2.Message);
    }

    [Fact]
    public void Constructor_ExcludeWeekends_InvalidFrequency_Throws()
    {
        // Arrange & Act & Assert
        var exception = Assert.Throws<ArgumentException>(() => new RandomQuotes(
            periodSize: PeriodSize.OneMinute,
            includeWeekends: false));
        Assert.Equal("includeWeekends", exception.ParamName);
        Assert.Contains("Weekends can only be excluded for period sizes between OneHour and OneWeek", exception.Message);
    }

    [Fact]
    public void Constructor_GeneratesRequestedCount()
    {
        // Arrange
        const int requestedBars = 25;

        // Act
        var quotes = new RandomQuotes(bars: requestedBars);

        // Assert
        Assert.Equal(requestedBars, quotes.Count);

        // Verify dates are in ascending order
        for (int i = 1; i < quotes.Count; i++)
        {
            Assert.True(quotes[i].Date > quotes[i - 1].Date, 
                $"Quote at index {i} should have a date after quote at index {i - 1}");
        }
    }

    [Fact]
    public void Constructor_ExcludeWeekends_RemovesWeekendBars()
    {
        // Arrange
        const int requestedBars = 240; // Enough to span multiple weeks
        const PeriodSize periodSize = PeriodSize.OneHour;
        const bool includeWeekends = false;

        // Act
        var quotes = new RandomQuotes(
            bars: requestedBars,
            periodSize: periodSize,
            includeWeekends: includeWeekends);

        // Assert
        Assert.Equal(requestedBars, quotes.Count);

        // Verify no Saturday or Sunday dates
        foreach (var quote in quotes)
        {
            Assert.True(quote.Date.DayOfWeek != DayOfWeek.Saturday, 
                $"Quote with date {quote.Date} should not be on Saturday");
            Assert.True(quote.Date.DayOfWeek != DayOfWeek.Sunday, 
                $"Quote with date {quote.Date} should not be on Sunday");
        }
    }
}