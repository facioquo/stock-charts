using Skender.Stock.Indicators;
using WebApi.Services;
using Xunit;

namespace WebApi.Tests;

public class RandomQuotesTests
{
    [Fact]
    public void Constructor_InvalidBars_Throws()
    {
        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() => new RandomQuotes(bars: 0));
        Assert.Equal("bars", exception.ParamName);
        Assert.Contains("Number of bars must be greater than zero", exception.Message);
    }

    [Fact]
    public void Constructor_InvalidVolatility_Throws()
    {
        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() => new RandomQuotes(volatility: 0.0));
        Assert.Equal("volatility", exception.ParamName);
        Assert.Contains("Volatility must be greater than zero", exception.Message);
    }

    [Fact]
    public void Constructor_InvalidSeed_Throws()
    {
        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() => new RandomQuotes(seed: 0.0));
        Assert.Equal("seed", exception.ParamName);
        Assert.Contains("Seed must be greater than zero", exception.Message);
    }

    [Fact]
    public void Constructor_ExcludeWeekends_InvalidFrequency_Throws()
    {
        // Act & Assert - OneMinute frequency with includeWeekends:false should throw
        var exception = Assert.Throws<ArgumentException>(() => new RandomQuotes(
            bars: 10,
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
        
        // Verify monotonic ascending timestamps
        for (int i = 1; i < quotes.Count; i++)
        {
            Assert.True(quotes[i].Date > quotes[i - 1].Date, 
                $"Quote at index {i} should have a later timestamp than quote at index {i - 1}");
        }
    }

    [Fact]
    public void Constructor_ExcludeWeekends_RemovesWeekendBars()
    {
        // Arrange - Use OneHour frequency which is valid for weekend exclusion, 
        // with enough bars to span at least one weekend
        const int requestedBars = 240; // 240 hours = 10 days, ensuring weekend coverage

        // Act
        var quotes = new RandomQuotes(
            bars: requestedBars,
            periodSize: PeriodSize.OneHour,
            includeWeekends: false);

        // Assert
        Assert.Equal(requestedBars, quotes.Count);
        
        // Verify no weekend quotes
        foreach (var quote in quotes)
        {
            Assert.True(quote.Date.DayOfWeek != DayOfWeek.Saturday, 
                $"Quote on {quote.Date} should not be on Saturday");
            Assert.True(quote.Date.DayOfWeek != DayOfWeek.Sunday, 
                $"Quote on {quote.Date} should not be on Sunday");
        }
    }
}