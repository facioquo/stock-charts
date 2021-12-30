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

    [HttpGet("quotes")]
    public IActionResult GetQuotes()
    {
        return Ok(quotes.Where(x => x.Date >= dateStart));
    }

    [HttpGet("indicators")]
    public IActionResult GetMetadata()
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
         decimal accelerationStep = 0.02m,
         decimal maxAccelerationFactor = 0.2m)
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
    public IActionResult GetRsi(
        int lookbackPeriods = 14)
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

    [HttpGet("STO")]
    public IActionResult GetStoch(
         int lookbackPeriods = 14,
         int signalPeriods = 3)
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
