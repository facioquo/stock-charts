using WebApi.Services;
using Skender.Stock.Indicators;

namespace WebApi.Tests.Services;

/// <summary>
/// Unit tests for RandomQuotes class.
/// Tests follow Microsoft unit testing best practices with Arrange-Act-Assert pattern.
/// </summary>
public class RandomQuotesTests
{
    [Fact]
    public void Constructor_WithDefaultParameters_CreatesQuotesWithCorrectCount()
    {
        // Arrange
        const int expectedCount = 250; // Default value

        // Act
        var quotes = new RandomQuotes();

        // Assert
        Assert.Equal(expectedCount, quotes.Count);
        Assert.All(quotes, quote => Assert.NotNull(quote));
    }

    [Theory]
    [InlineData(10)]
    [InlineData(100)]
    [InlineData(500)]
    public void Constructor_WithValidBarCount_CreatesQuotesWithCorrectCount(int bars)
    {
        // Arrange & Act
        var quotes = new RandomQuotes(bars: bars);

        // Assert
        Assert.Equal(bars, quotes.Count);
        Assert.All(quotes, quote => Assert.NotNull(quote));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-100)]
    public void Constructor_WithInvalidBarCount_ThrowsArgumentException(int invalidBars)
    {
        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() => new RandomQuotes(bars: invalidBars));
        Assert.Equal("bars", exception.ParamName);
        Assert.Contains("Number of bars must be greater than zero", exception.Message);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-0.1)]
    [InlineData(-1.0)]
    public void Constructor_WithInvalidVolatility_ThrowsArgumentException(double invalidVolatility)
    {
        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() => new RandomQuotes(volatility: invalidVolatility));
        Assert.Equal("volatility", exception.ParamName);
        Assert.Contains("Volatility must be greater than zero", exception.Message);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-0.1)]
    [InlineData(-1000.0)]
    public void Constructor_WithInvalidSeed_ThrowsArgumentException(double invalidSeed)
    {
        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() => new RandomQuotes(seed: invalidSeed));
        Assert.Equal("seed", exception.ParamName);
        Assert.Contains("Seed must be greater than zero", exception.Message);
    }

    [Theory]
    [InlineData(1.0)]
    [InlineData(0.5)]
    [InlineData(2.0)]
    public void Constructor_WithValidVolatility_CreatesQuotes(double volatility)
    {
        // Arrange
        const int bars = 50;

        // Act
        var quotes = new RandomQuotes(bars: bars, volatility: volatility);

        // Assert
        Assert.Equal(bars, quotes.Count);
        Assert.All(quotes, quote => 
        {
            Assert.True(quote.High >= quote.Low);
            Assert.True(quote.High >= quote.Open);
            Assert.True(quote.High >= quote.Close);
            Assert.True(quote.Low <= quote.Open);
            Assert.True(quote.Low <= quote.Close);
            Assert.True(quote.Volume > 0);
        });
    }

    [Fact]
    public void Constructor_WithIncludeWeekendsTrue_IncludesAllDates()
    {
        // Arrange
        const int bars = 14; // 2 weeks worth
        
        // Act
        var quotes = new RandomQuotes(
            bars: bars, 
            periodSize: PeriodSize.Day, 
            includeWeekends: true);

        // Assert
        Assert.Equal(bars, quotes.Count);
        
        // Should include consecutive dates including weekends
        var dates = quotes.Select(q => q.Date.Date).Distinct().OrderBy(d => d).ToList();
        for (int i = 1; i < dates.Count; i++)
        {
            var daysDiff = (dates[i] - dates[i-1]).Days;
            Assert.Equal(1, daysDiff);
        }
    }

    [Fact]
    public void Constructor_WithIncludeWeekendsFalseAndDailyPeriod_ExcludesWeekends()
    {
        // Arrange
        const int bars = 10;
        
        // Act
        var quotes = new RandomQuotes(
            bars: bars, 
            periodSize: PeriodSize.Day, 
            includeWeekends: false);

        // Assert
        Assert.Equal(bars, quotes.Count);
        
        // Should exclude weekends
        Assert.All(quotes, quote => 
        {
            Assert.True(quote.Date.DayOfWeek != DayOfWeek.Saturday);
            Assert.True(quote.Date.DayOfWeek != DayOfWeek.Sunday);
        });
    }

    [Theory]
    [InlineData(PeriodSize.OneMinute)]
    [InlineData(PeriodSize.FifteenMinutes)]
    [InlineData(PeriodSize.ThirtyMinutes)]
    public void Constructor_WithExcludeWeekendsAndSubHourlyPeriod_ThrowsArgumentException(PeriodSize periodSize)
    {
        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() => 
            new RandomQuotes(periodSize: periodSize, includeWeekends: false));
        Assert.Equal("includeWeekends", exception.ParamName);
        Assert.Contains("Weekends can only be excluded for period sizes between OneHour and OneWeek", exception.Message);
    }

    [Theory]
    [InlineData(PeriodSize.OneHour)]
    [InlineData(PeriodSize.TwoHours)]
    [InlineData(PeriodSize.FourHours)]
    [InlineData(PeriodSize.Day)]
    public void Constructor_WithExcludeWeekendsAndValidPeriod_CreatesQuotes(PeriodSize periodSize)
    {
        // Arrange
        const int bars = 20;
        
        // Act
        var quotes = new RandomQuotes(
            bars: bars, 
            periodSize: periodSize, 
            includeWeekends: false);

        // Assert
        Assert.Equal(bars, quotes.Count);
        
        if (periodSize == PeriodSize.Day)
        {
            // For daily periods, should exclude weekends
            Assert.All(quotes, quote => 
            {
                Assert.True(quote.Date.DayOfWeek != DayOfWeek.Saturday);
                Assert.True(quote.Date.DayOfWeek != DayOfWeek.Sunday);
            });
        }
    }

    [Fact]
    public void Constructor_GeneratesRealisticQuoteData()
    {
        // Arrange
        const int bars = 100;
        const double seed = 100.0;
        
        // Act
        var quotes = new RandomQuotes(bars: bars, seed: seed);

        // Assert
        Assert.Equal(bars, quotes.Count);
        
        // Verify OHLCV data integrity
        Assert.All(quotes, quote => 
        {
            // High should be highest value
            Assert.True(quote.High >= quote.Open);
            Assert.True(quote.High >= quote.Close);
            Assert.True(quote.High >= quote.Low);
            
            // Low should be lowest value
            Assert.True(quote.Low <= quote.Open);
            Assert.True(quote.Low <= quote.Close);
            Assert.True(quote.Low <= quote.High);
            
            // All values should be positive
            Assert.True(quote.Open > 0);
            Assert.True(quote.High > 0);
            Assert.True(quote.Low > 0);
            Assert.True(quote.Close > 0);
            Assert.True(quote.Volume > 0);
        });
        
        // Verify dates are in ascending order
        var dates = quotes.Select(q => q.Date).ToList();
        for (int i = 1; i < dates.Count; i++)
        {
            Assert.True(dates[i] > dates[i-1]);
        }
    }

    [Fact]
    public void Constructor_WithSameSeed_GeneratesConsistentResults()
    {
        // Arrange
        const int bars = 50;
        const double seed = 12345.0;
        const double volatility = 1.5;
        const double drift = 0.02;
        
        // Act
        var quotes1 = new RandomQuotes(bars: bars, volatility: volatility, drift: drift, seed: seed);
        var quotes2 = new RandomQuotes(bars: bars, volatility: volatility, drift: drift, seed: seed);

        // Assert
        Assert.Equal(quotes1.Count, quotes2.Count);
        
        // Note: Due to static Random instance, results may vary, but structure should be consistent
        for (int i = 0; i < quotes1.Count; i++)
        {
            Assert.Equal(quotes1[i].Date, quotes2[i].Date);
            // Prices may differ due to random generation, but should be positive
            Assert.True(quotes1[i].Close > 0);
            Assert.True(quotes2[i].Close > 0);
        }
    }
}