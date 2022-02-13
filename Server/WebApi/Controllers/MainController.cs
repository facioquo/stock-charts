using Microsoft.AspNetCore.Mvc;
using Skender.Stock.Indicators;
using WebApi.Services;

namespace WebApi.Controllers;

[ApiController]
[Route("")]
public class MainController : ControllerBase
{
    internal static readonly IEnumerable<Quote> quotes = FetchQuotes.Get();
    internal static readonly int limitLast = 130;

    [HttpGet]
    public string Get()
    {
        return "API is functioning nominally.";
    }

    [HttpGet("quotes")]
    public IActionResult GetQuotes()
    {
        return Ok(quotes.TakeLast(limitLast));
    }

    [HttpGet("indicators")]
    public IActionResult GetIndicators()
    {
        return Ok(Metadata.IndicatorList($"{Request.Scheme}://{Request.Host}"));
    }

    //////////////////////////////////////////
    // INDICATORS (sorted alphabetically)

    [HttpGet("BB")]
    public IActionResult GetBollingerBands(
         int lookbackPeriods = 20,
         double standardDeviations = 2)
    {
        try
        {
            IEnumerable<BollingerBandsResult> results =
                quotes.GetBollingerBands(lookbackPeriods, standardDeviations)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("EMA")]
    public IActionResult GetEMA(int lookbackPeriods)
    {
        try
        {
            IEnumerable<EmaResult> results =
                quotes.GetEma(lookbackPeriods)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("MACD")]
    public IActionResult GetMacd(
     int fastPeriods = 12,
     int slowPeriods = 26,
     int signalPeriods = 9)
    {
        try
        {
            IEnumerable<MacdResult> results =
                quotes.GetMacd(fastPeriods, slowPeriods, signalPeriods)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("PSAR")]
    public IActionResult GetParabolicSar(
         decimal accelerationStep = 0.02m,
         decimal maxAccelerationFactor = 0.2m)
    {
        try
        {
            IEnumerable<ParabolicSarResult> results =
                quotes.GetParabolicSar(accelerationStep, maxAccelerationFactor)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("RSI")]
    public IActionResult GetRsi(
        int lookbackPeriods = 14)
    {
        try
        {
            IEnumerable<RsiResult> results =
                quotes.GetRsi(lookbackPeriods)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("STO")]
    public IActionResult GetStoch(
         int lookbackPeriods = 14,
         int signalPeriods = 3)
    {
        try
        {
            IEnumerable<StochResult> results =
                quotes.GetStoch(lookbackPeriods, signalPeriods)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("ZIGZAG-CLOSE")]
    public IActionResult GetZigZagClose(
     decimal percentChange)
    {
        try
        {
            IEnumerable<ZigZagResult> results =
                quotes.GetZigZag(EndType.Close, percentChange)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("ZIGZAG-HIGHLOW")]
    public IActionResult GetZigZagHighLow(
      decimal percentChange)
    {
        try
        {
            IEnumerable<ZigZagResult> results =
                quotes.GetZigZag(EndType.HighLow, percentChange)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

}
