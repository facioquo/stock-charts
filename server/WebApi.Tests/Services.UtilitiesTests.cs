using WebApi.Services;
using Skender.Stock.Indicators;

namespace WebApi.Tests.Services;

/// <summary>
/// Unit tests for Utilities.ToTimeSpan extension method.
/// Tests follow Microsoft unit testing best practices with Arrange-Act-Assert pattern.
/// </summary>
public class UtilitiesTests
{
    [Theory]
    [InlineData(PeriodSize.OneMinute, 1)]
    [InlineData(PeriodSize.TwoMinutes, 2)]
    [InlineData(PeriodSize.ThreeMinutes, 3)]
    [InlineData(PeriodSize.FiveMinutes, 5)]
    [InlineData(PeriodSize.FifteenMinutes, 15)]
    [InlineData(PeriodSize.ThirtyMinutes, 30)]
    public void ToTimeSpan_WithValidMinutePeriods_ReturnsCorrectTimeSpan(PeriodSize periodSize, int expectedMinutes)
    {
        // Arrange
        var expected = TimeSpan.FromMinutes(expectedMinutes);

        // Act
        var result = periodSize.ToTimeSpan();

        // Assert
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData(PeriodSize.OneHour, 1)]
    [InlineData(PeriodSize.TwoHours, 2)]
    [InlineData(PeriodSize.FourHours, 4)]
    public void ToTimeSpan_WithValidHourPeriods_ReturnsCorrectTimeSpan(PeriodSize periodSize, int expectedHours)
    {
        // Arrange
        var expected = TimeSpan.FromHours(expectedHours);

        // Act
        var result = periodSize.ToTimeSpan();

        // Assert
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData(PeriodSize.Day, 1)]
    [InlineData(PeriodSize.Week, 7)]
    public void ToTimeSpan_WithValidDayPeriods_ReturnsCorrectTimeSpan(PeriodSize periodSize, int expectedDays)
    {
        // Arrange
        var expected = TimeSpan.FromDays(expectedDays);

        // Act
        var result = periodSize.ToTimeSpan();

        // Assert
        Assert.Equal(expected, result);
    }

    [Fact]
    public void ToTimeSpan_WithUnsupportedPeriodSize_ThrowsArgumentOutOfRangeException()
    {
        // Arrange
        var unsupportedPeriod = PeriodSize.Month;

        // Act & Assert
        var exception = Assert.Throws<ArgumentOutOfRangeException>(() => unsupportedPeriod.ToTimeSpan());
        Assert.Equal("periodSize", exception.ParamName);
        Assert.Contains("Unsupported PeriodSize value", exception.Message);
        Assert.Contains("Add explicit mapping in ToTimeSpan()", exception.Message);
    }

    [Fact]
    public void ToTimeSpan_WithInvalidEnumValue_ThrowsArgumentOutOfRangeException()
    {
        // Arrange
        var invalidPeriod = (PeriodSize)999; // Invalid enum value

        // Act & Assert
        var exception = Assert.Throws<ArgumentOutOfRangeException>(() => invalidPeriod.ToTimeSpan());
        Assert.Equal("periodSize", exception.ParamName);
        Assert.Contains("Unsupported PeriodSize value", exception.Message);
    }
}
