using Skender.Stock.Indicators;
using WebApi.Services;

namespace WebApi.Tests;

public class UtilitiesTests
{
    [Theory]
    [InlineData(PeriodSize.OneMinute, 1)]
    [InlineData(PeriodSize.FifteenMinutes, 15)]
    [InlineData(PeriodSize.OneHour, 60)]
    [InlineData(PeriodSize.Day, 1440)]
    [InlineData(PeriodSize.Week, 10080)]
    public void ToTimeSpan_KnownMappings_ReturnsExpected(PeriodSize periodSize, double expectedMinutes)
    {
        // Arrange
        TimeSpan expectedTimeSpan = TimeSpan.FromMinutes(expectedMinutes);

        // Act
        TimeSpan actual = periodSize.ToTimeSpan();

        // Assert
        Assert.Equal(expectedTimeSpan, actual);
    }

    [Fact]
    public void ToTimeSpan_Unsupported_ThrowsArgumentOutOfRange()
    {
        // Arrange
        PeriodSize unsupportedPeriodSize = (PeriodSize)999;

        // Act & Assert
        ArgumentOutOfRangeException exception = Assert.Throws<ArgumentOutOfRangeException>(() => 
            unsupportedPeriodSize.ToTimeSpan());
        
        Assert.Equal("periodSize", exception.ParamName);
        Assert.Contains("Unsupported PeriodSize value", exception.Message);
    }
}