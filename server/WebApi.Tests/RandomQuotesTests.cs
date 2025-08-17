using Skender.Stock.Indicators;
using WebApi.Services;

namespace WebApi.Tests;

public class RandomQuotesTests
{
    [Fact]
    public void Constructor_InvalidBars_Throws()
    {
        // Arrange & Act & Assert
        ArgumentException exception = Assert.Throws<ArgumentException>(() => 
            new RandomQuotes(bars: 0));
        
        Assert.Equal("bars", exception.ParamName);
        Assert.Contains("Number of bars must be greater than zero", exception.Message);
    }

    [Fact]
    public void Constructor_InvalidVolatility_Throws()
    {
        // Arrange & Act & Assert
        ArgumentException exception = Assert.Throws<ArgumentException>(() => 
            new RandomQuotes(volatility: 0));
        
        Assert.Equal("volatility", exception.ParamName);
        Assert.Contains("Volatility must be greater than zero", exception.Message);
    }

    [Fact]
    public void Constructor_InvalidSeed_Throws()
    {
        // Arrange & Act & Assert
        ArgumentException exception = Assert.Throws<ArgumentException>(() => 
            new RandomQuotes(seed: 0));
        
        Assert.Equal("seed", exception.ParamName);
        Assert.Contains("Seed must be greater than zero", exception.Message);
    }

    [Fact]
    public void Constructor_ExcludeWeekends_InvalidFrequency_Throws()
    {
        // Arrange & Act & Assert
        ArgumentException exception = Assert.Throws<ArgumentException>(() => 
            new RandomQuotes(periodSize: PeriodSize.OneMinute, includeWeekends: false));
        
        Assert.Equal("includeWeekends", exception.ParamName);
        Assert.Contains("Weekends can only be excluded for period sizes between OneHour and OneWeek", exception.Message);
    }

    [Fact]
    public void Constructor_GeneratesRequestedCount()
    {
        // Arrange
        int expectedBars = 25;

        // Act
        RandomQuotes quotes = new RandomQuotes(bars: expectedBars);

        // Assert
        Assert.Equal(expectedBars, quotes.Count);
        
        // Verify dates are in ascending order
        for (int i = 1; i < quotes.Count; i++)
        {
            Assert.True(quotes[i].Date >= quotes[i - 1].Date, 
                $"Quote at index {i} has date {quotes[i].Date} which is not >= previous date {quotes[i - 1].Date}");
        }
    }

    [Fact]
    public void Constructor_ExcludeWeekends_RemovesWeekendBars()
    {
        // Arrange
        int requestedBars = 240;

        // Act
        RandomQuotes quotes = new RandomQuotes(
            bars: requestedBars, 
            periodSize: PeriodSize.OneHour, 
            includeWeekends: false);

        // Assert
        Assert.Equal(requestedBars, quotes.Count);
        
        // Verify no weekend dates (Saturday or Sunday)
        foreach (var quote in quotes)
        {
            Assert.True(quote.Date.DayOfWeek != DayOfWeek.Saturday && quote.Date.DayOfWeek != DayOfWeek.Sunday,
                $"Quote has weekend date: {quote.Date} ({quote.Date.DayOfWeek})");
        }
    }
}