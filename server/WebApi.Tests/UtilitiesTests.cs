using Skender.Stock.Indicators;
using WebApi.Services;
using Xunit;

namespace WebApi.Tests;

public class UtilitiesTests
{
    [Theory]
    [InlineData(PeriodSize.OneMinute, 1, 0, 0, 0)]
    [InlineData(PeriodSize.FifteenMinutes, 15, 0, 0, 0)]
    [InlineData(PeriodSize.OneHour, 60, 0, 0, 0)]
    [InlineData(PeriodSize.Day, 0, 24, 0, 0)]
    [InlineData(PeriodSize.Week, 0, 0, 7, 0)]
    public void ToTimeSpan_KnownMappings_ReturnsExpected(PeriodSize periodSize, int expectedMinutes, int expectedHours, int expectedDays, int expectedSeconds)
    {
        // Arrange
        var expected = new TimeSpan(expectedDays, expectedHours, expectedMinutes, expectedSeconds);

        // Act
        var result = periodSize.ToTimeSpan();

        // Assert
        Assert.Equal(expected, result);
    }

    [Fact]
    public void ToTimeSpan_Unsupported_ThrowsArgumentOutOfRange()
    {
        // Arrange
        var unsupportedPeriodSize = (PeriodSize)999;

        // Act & Assert
        var exception = Assert.Throws<ArgumentOutOfRangeException>(() => unsupportedPeriodSize.ToTimeSpan());
        Assert.Equal("periodSize", exception.ParamName);
        Assert.Equal(unsupportedPeriodSize, exception.ActualValue);
        Assert.Contains("Unsupported PeriodSize value", exception.Message);
    }
}