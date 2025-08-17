namespace WebApi.Tests;

public class UtilitiesTests
{
    [Theory]
    [InlineData(PeriodSize.OneMinute, 1)]
    [InlineData(PeriodSize.FifteenMinutes, 15)]
    [InlineData(PeriodSize.OneHour, 60)]
    [InlineData(PeriodSize.Day, 1440)]
    [InlineData(PeriodSize.Week, 10080)]
    public void ToTimeSpan_KnownMappings_ReturnsExpected(PeriodSize periodSize, int expectedMinutes)
    {
        // Arrange
        var expectedTimeSpan = TimeSpan.FromMinutes(expectedMinutes);

        // Act
        var result = periodSize.ToTimeSpan();

        // Assert
        Assert.Equal(expectedTimeSpan, result);
    }

    [Fact]
    public void ToTimeSpan_Unsupported_ThrowsArgumentOutOfRange()
    {
        // Arrange
        var unsupportedPeriodSize = (PeriodSize)999;

        // Act & Assert
        var exception = Assert.Throws<ArgumentOutOfRangeException>(() => unsupportedPeriodSize.ToTimeSpan());
        Assert.Equal("periodSize", exception.ParamName);
        Assert.Contains("Unsupported PeriodSize value", exception.Message);
    }
}