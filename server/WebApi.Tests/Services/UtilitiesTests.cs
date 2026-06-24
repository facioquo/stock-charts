namespace WebApi.Tests.Services;

public class UtilitiesTests
{
    [Theory]
    [InlineData(BarInterval.OneMinute, 1)]
    [InlineData(BarInterval.TwoMinutes, 2)]
    [InlineData(BarInterval.ThreeMinutes, 3)]
    [InlineData(BarInterval.FiveMinutes, 5)]
    [InlineData(BarInterval.FifteenMinutes, 15)]
    [InlineData(BarInterval.ThirtyMinutes, 30)]
    public void ToTimeSpan_KnownMappings_ReturnsExpected(BarInterval periodSize, int expectedMinutes)
    {
        // Arrange & Act
        TimeSpan result = Utilities.ToTimeSpan(periodSize);

        // Assert
        Assert.Equal(TimeSpan.FromMinutes(expectedMinutes), result);
    }

    [Theory]
    [InlineData(BarInterval.OneHour, 1)]
    [InlineData(BarInterval.TwoHours, 2)]
    [InlineData(BarInterval.FourHours, 4)]
    public void ToTimeSpan_KnownHourMappings_ReturnsExpected(BarInterval periodSize, int expectedHours)
    {
        // Arrange & Act
        TimeSpan result = Utilities.ToTimeSpan(periodSize);

        // Assert
        Assert.Equal(TimeSpan.FromHours(expectedHours), result);
    }

    [Theory]
    [InlineData(BarInterval.Day, 1)]
    [InlineData(BarInterval.Week, 7)]
    public void ToTimeSpan_KnownDayMappings_ReturnsExpected(BarInterval periodSize, int expectedDays)
    {
        // Arrange & Act
        TimeSpan result = Utilities.ToTimeSpan(periodSize);

        // Assert
        Assert.Equal(TimeSpan.FromDays(expectedDays), result);
    }

    [Fact]
    public void ToTimeSpan_Unsupported_ThrowsArgumentOutOfRange()
    {
        // Arrange
        const BarInterval unsupportedPeriod = BarInterval.Month;

        // Act & Assert
        ArgumentOutOfRangeException exception = Assert.Throws<ArgumentOutOfRangeException>(() => Utilities.ToTimeSpan(unsupportedPeriod));
        Assert.Equal("periodSize", exception.ParamName);
        Assert.Contains("Unsupported BarInterval value", exception.Message);
        Assert.Contains("Month", exception.Message);
    }
}
