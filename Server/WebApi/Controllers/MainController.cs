using Microsoft.AspNetCore.Mvc;
using Skender.Stock.Indicators;
using WebApi.Services;

namespace WebApi.Controllers;

[ApiController]
[Route("")]
public class MainController : ControllerBase
{
    internal static readonly int limitLast = 120;

    [HttpGet]
    public string Get()
    {
        return "API is functioning nominally.";
    }

    [HttpGet("quotes")]
    public IActionResult GetQuotes(
        string symbol = "QQQ",
        string timeSpan = "DAILY")
    {
        IEnumerable<Quote> quotes = FetchQuotes.Get(symbol, timeSpan);
        return Ok(quotes.TakeLast(limitLast));
    }

    [HttpGet("indicators")]
    public IActionResult GetIndicators()
    {
        return Ok(Metadata.IndicatorList($"{Request.Scheme}://{Request.Host}"));
    }

    //////////////////////////////////////////
    // INDICATORS (sorted alphabetically)

    [HttpGet("ADL")]
    public IActionResult GetAdl(
        int smaPeriods = 3)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<AdlResult> results =
                quotes.GetAdl(smaPeriods)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("ADX")]
    public IActionResult GetAdx(int lookbackPeriods = 14)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<AdxResult> results =
                quotes.GetAdx(lookbackPeriods)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("AROON")]
    public IActionResult GetAroon(int lookbackPeriods = 25)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<AroonResult> results =
                quotes.GetAroon(lookbackPeriods)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("ATR")]
    public IActionResult GetAtr(
    int lookbackPeriods = 14)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<AtrResult> results =
                quotes.GetAtr(lookbackPeriods)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("BB")]
    public IActionResult GetBollingerBands(
        int lookbackPeriods = 20,
        double standardDeviations = 2)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

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

    [HttpGet("CHEXIT-LONG")]
    public IActionResult GetChandelierLong(
        int lookbackPeriods,
        double multiplier)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<ChandelierResult> results =
                quotes.GetChandelier(lookbackPeriods, multiplier, ChandelierType.Long)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("CHEXIT-SHORT")]
    public IActionResult GetChandelierShort(
        int lookbackPeriods,
        double multiplier)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<ChandelierResult> results =
                quotes.GetChandelier(lookbackPeriods, multiplier, ChandelierType.Short)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("CHOP")]
    public IActionResult GetChop(int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<ChopResult> results =
                quotes.GetChop(lookbackPeriods)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("DONCHIAN")]
    public IActionResult GetDonchian(int lookbackPeriods = 20)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<DonchianResult> results =
                quotes.GetDonchian(lookbackPeriods)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("ELDER-RAY")]
    public IActionResult GetElderRay(int lookbackPeriods = 13)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<ElderRayResult> results =
                quotes.GetElderRay(lookbackPeriods)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("EMA")]
    public IActionResult GetEma(int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

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

    [HttpGet("FISHER")]
    public IActionResult GetFisher(
        int lookbackPeriods = 10)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<FisherTransformResult> results =
                quotes.GetFisherTransform(lookbackPeriods)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("FRACTAL")]
    public IActionResult GetFractal(int windowSpan = 2)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<FractalResult> results =
                quotes.GetFractal(windowSpan)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("GATOR")]
    public IActionResult GetGator()
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<GatorResult> results =
                quotes.GetGator()
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("HTL")]
    public IActionResult GetHTL()
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<HtlResult> results =
                quotes.GetHtTrendline()
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("KELTNER")]
    public IActionResult GetKeltner(
        int emaPeriods = 20,
        decimal multiplier = 2,
        int atrPeriods = 10)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<KeltnerResult> results =
                quotes.GetKeltner(emaPeriods, multiplier, atrPeriods)
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
            IEnumerable<Quote> quotes = FetchQuotes.Get();

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

    [HttpGet("MFI")]
    public IActionResult GetMfi(int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<MfiResult> results =
                quotes.GetMfi(lookbackPeriods)
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
            IEnumerable<Quote> quotes = FetchQuotes.Get();

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

    [HttpGet("ROC")]
    public IActionResult GetRoc(
        int lookbackPeriods,
        int smaPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<RocResult> results =
                quotes.GetRoc(lookbackPeriods, smaPeriods)
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
            IEnumerable<Quote> quotes = FetchQuotes.Get();

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

    [HttpGet("SLOPE")]
    public IActionResult GetSlope(
        int lookbackPeriods = 14)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<SlopeResult> results =
                quotes.GetSlope(lookbackPeriods)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("SMA")]
    public IActionResult GetSma(int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<SmaResult> results =
                quotes.GetSma(lookbackPeriods)
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
            IEnumerable<Quote> quotes = FetchQuotes.Get();

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

    [HttpGet("STORSI")]
    public IActionResult GetStochRsi(
        int rsiPeriods,
        int stochPeriods,
        int signalPeriods,
        int smoothPeriods = 1)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<StochRsiResult> results =
                quotes.GetStochRsi(rsiPeriods, stochPeriods, signalPeriods, smoothPeriods)
                        .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("SUPERTREND")]
    public IActionResult GetSuperTrend(
        int lookbackPeriods = 10,
        double multiplier = 3)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<SuperTrendResult> results =
                quotes.GetSuperTrend(lookbackPeriods, multiplier)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("VORTEX")]
    public IActionResult GetVortex(
        int lookbackPeriods = 14)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<VortexResult> results =
                quotes.GetVortex(lookbackPeriods)
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
            IEnumerable<Quote> quotes = FetchQuotes.Get();

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
            IEnumerable<Quote> quotes = FetchQuotes.Get();

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
