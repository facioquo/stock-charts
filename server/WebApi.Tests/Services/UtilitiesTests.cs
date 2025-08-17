namespace WebApi.Tests.Services;

public class UtilitiesTests
{
    [Theory]
    [InlineData(PeriodSize.OneMinute, 1)]
    [InlineData(PeriodSize.TwoMinutes, 2)]
    [InlineData(PeriodSize.ThreeMinutes, 3)]
    [InlineData(PeriodSize.FiveMinutes, 5)]
    [InlineData(PeriodSize.FifteenMinutes, 15)]
    [InlineData(PeriodSize.ThirtyMinutes, 30)]
    public void ToTimeSpan_KnownMappings_ReturnsExpected(PeriodSize periodSize, int expectedMinutes)
    {
        // Arrange & Act
        TimeSpan result = periodSize.ToTimeSpan();

        // Assert
        Assert.Equal(TimeSpan.FromMinutes(expectedMinutes), result);
    }

    [Theory]
    [InlineData(PeriodSize.OneHour, 1)]
    [InlineData(PeriodSize.TwoHours, 2)]
    [InlineData(PeriodSize.FourHours, 4)]
    public void ToTimeSpan_KnownHourMappings_ReturnsExpected(PeriodSize periodSize, int expectedHours)
    {
        // Arrange & Act
        TimeSpan result = periodSize.ToTimeSpan();

        // Assert
        Assert.Equal(TimeSpan.FromHours(expectedHours), result);
    }

    [Theory]
    [InlineData(PeriodSize.Day, 1)]
    [InlineData(PeriodSize.Week, 7)]
    public void ToTimeSpan_KnownDayMappings_ReturnsExpected(PeriodSize periodSize, int expectedDays)
    {
        // Arrange & Act
        TimeSpan result = periodSize.ToTimeSpan();

        // Assert
        Assert.Equal(TimeSpan.FromDays(expectedDays), result);
    }

    [Fact]
    public void ToTimeSpan_Unsupported_ThrowsArgumentOutOfRange()
    {
        // Arrange
        PeriodSize unsupportedPeriod = PeriodSize.Month;

        // Act & Assert
        ArgumentOutOfRangeException exception = Assert.Throws<ArgumentOutOfRangeException>(() => unsupportedPeriod.ToTimeSpan());
        Assert.Equal("periodSize", exception.ParamName);
        Assert.Contains("Unsupported PeriodSize value", exception.Message);
        Assert.Contains("Month", exception.Message);
    }
}