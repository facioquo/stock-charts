using Microsoft.AspNetCore.Mvc;
using Skender.Stock.Indicators;
using WebApi.Services;

namespace WebApi.Controllers;


[ApiController]
[Route("")]
public class MainController : ControllerBase
{
    internal static readonly IEnumerable<Quote> quotes = FetchQuotes.Get();
    internal static readonly DateTime dateStart = DateTime.Parse("6/1/2018");

    [HttpGet]
    public string Get()
    {
        return "API is functioning nominally.";
    }

    [HttpGet("history")]
    public IEnumerable<Quote> GetQuotes()
    {
        return quotes
            .Where(x => x.Date >= dateStart);
    }


    //////////////////////////////////////////
    // INDICATORS (sorted alphabetically)

    [HttpGet("BB")]
    public IActionResult GetBollingerBands(
         int lookbackPeriods,
         double standardDeviations)
    {
        try
        {
            IEnumerable<BollingerBandsResult> results =
                quotes.GetBollingerBands(lookbackPeriods, standardDeviations)
                      .Where(x => x.Date >= dateStart);

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
                      .Where(x => x.Date >= dateStart);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("PSAR")]
    public IActionResult GetParabolicSar(
         decimal accelerationStep,
         decimal maxAccelerationFactor)
    {
        try
        {
            IEnumerable<ParabolicSarResult> results =
                quotes.GetParabolicSar(accelerationStep, maxAccelerationFactor)
                      .Where(x => x.Date >= dateStart);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("RSI")]
    public IActionResult GetRsi(int lookbackPeriods)
    {
        try
        {
            IEnumerable<RsiResult> results =
                quotes.GetRsi(lookbackPeriods)
                      .Where(x => x.Date >= dateStart);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("STOCH")]
    public IActionResult GetStoch(
         int lookbackPeriods,
         int signalPeriods)
    {
        try
        {
            IEnumerable<StochResult> results =
                quotes.GetStoch(lookbackPeriods, signalPeriods)
                      .Where(x => x.Date >= dateStart);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }
}
