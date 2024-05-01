using Microsoft.AspNetCore.Mvc;
using Skender.Stock.Indicators;
using WebApi.Services;

namespace WebApi.Controllers;

[ApiController]
[Route("")]
public class MainController : ControllerBase
{
    // GLOBALS
    internal static readonly int limitLast = 120;

    [HttpGet]
    public string Get() => "API is functioning nominally.";

    [HttpGet("quotes")]
    public IActionResult GetQuotes()
    {
        IEnumerable<Quote> quotes = FetchQuotes.Get();
        return Ok(quotes.TakeLast(limitLast));
    }

    [HttpGet("indicators")]
    public IActionResult GetIndicators() => Ok(Metadata.IndicatorList($"{Request.Scheme}://{Request.Host}"));

    //////////////////////////////////////////
    // INDICATORS (sorted alphabetically)

    [HttpGet("ADL")]
    public IActionResult GetAdl(
        int smaPeriods)
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
    public IActionResult GetAdx(
        int lookbackPeriods)
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

    [HttpGet("ALMA")]
    public IActionResult GetAlma(
        int lookbackPeriods,
        double offset,
        double sigma)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<AlmaResult> results =
                quotes.GetAlma(lookbackPeriods, offset, sigma)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("ALLIGATOR")]
    public IActionResult GetAlligator(
        int jawPeriods,
        int jawOffset,
        int teethPeriods,
        int teethOffset,
        int lipsPeriods,
        int lipsOffset)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<AlligatorResult> results =
                quotes.GetAlligator(jawPeriods, jawOffset, teethPeriods, teethOffset, lipsPeriods, lipsOffset)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("AROON")]
    public IActionResult GetAroon(
        int lookbackPeriods)
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
    int lookbackPeriods)
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

    [HttpGet("ATR-STOP-CLOSE")]
    public IActionResult GetAtrStopClose(
        int lookbackPeriods,
        double multiplier)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<AtrStopResult> results =
                quotes.GetAtrStop(lookbackPeriods, multiplier, EndType.Close)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("ATR-STOP-HL")]
    public IActionResult GetAtrStopHL(
        int lookbackPeriods,
        double multiplier)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<AtrStopResult> results =
                quotes.GetAtrStop(lookbackPeriods, multiplier, EndType.HighLow)
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
        int lookbackPeriods,
        double standardDeviations)
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

    [HttpGet("BETA")]
    public IActionResult GetBeta(
        int lookbackPeriods,
        BetaType type)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();
            IEnumerable<Quote> market = FetchQuotes.Get("SPY", "DAILY");

            IEnumerable<BetaResult> results =
                quotes.GetBeta(market, lookbackPeriods, type)
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
    public IActionResult GetChop(
        int lookbackPeriods)
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

    [HttpGet("CMF")]
    public IActionResult GetCmf(
        int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<CmfResult> results =
                quotes.GetCmf(lookbackPeriods)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("CMO")]
    public IActionResult GetCmo(
        int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<CmoResult> results =
                quotes.GetCmo(lookbackPeriods)
                        .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("CRSI")]
    public IActionResult GetConnorsRsi(
        int rsiPeriods,
        int streakPeriods,
        int rankPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<ConnorsRsiResult> results =
                quotes.GetConnorsRsi(rsiPeriods, streakPeriods, rankPeriods)
                        .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("DOJI")]
    public IActionResult GetDoji(
        double maxPriceChangePercent)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<CandleResult> results =
                quotes.GetDoji(maxPriceChangePercent)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("DONCHIAN")]
    public IActionResult GetDonchian(
        int lookbackPeriods)
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

    [HttpGet("DYN")]
    public IActionResult GetDynamic(
    int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<DynamicResult> results =
                quotes.GetDynamic(lookbackPeriods)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("ELDER-RAY")]
    public IActionResult GetElderRay(
        int lookbackPeriods)
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

    [HttpGet("EPMA")]
    public IActionResult GetEpma(
        int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<EpmaResult> results =
                quotes.GetEpma(lookbackPeriods)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("EMA")]
    public IActionResult GetEma(
        int lookbackPeriods)
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

    [HttpGet("FCB")]
    public IActionResult GetFcb(
        int windowSpan)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<FcbResult> results =
                quotes.GetFcb(windowSpan)
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
        int lookbackPeriods)
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
    public IActionResult GetFractal(
        int windowSpan)
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
        int emaPeriods,
        double multiplier,
        int atrPeriods)
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
        int fastPeriods,
        int slowPeriods,
        int signalPeriods)
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

    [HttpGet("MARUBOZU")]
    public IActionResult GetMarubozu(
        double minBodyPercent)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<CandleResult> results =
                quotes.GetMarubozu(minBodyPercent)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("MFI")]
    public IActionResult GetMfi(
        int lookbackPeriods)
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
        double accelerationStep,
        double maxAccelerationFactor)
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
        int lookbackPeriods)
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
        int lookbackPeriods)
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
    public IActionResult GetSma(
        int lookbackPeriods)
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

    [HttpGet("SMI")]
    public IActionResult GetSmi(
        int lookbackPeriods,
        int firstSmoothPeriods,
        int secondSmoothPeriods,
        int signalPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<SmiResult> results =
                quotes.GetSmi(lookbackPeriods, firstSmoothPeriods, secondSmoothPeriods, signalPeriods)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("STC")]
    public IActionResult GetStc(
        int cyclePeriods,
        int fastPeriods,
        int slowPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<StcResult> results =
                quotes.GetStc(cyclePeriods, fastPeriods, slowPeriods)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("STARC")]
    public IActionResult GetStarc(
        int smaPeriods,
        double multiplier,
        int atrPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<StarcBandsResult> results =
                quotes.GetStarcBands(smaPeriods, multiplier, atrPeriods)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("STDEV")]
    public IActionResult GetStdDev(
        int lookbackPeriods,
        int smaPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            // we don't ask for smaPeriods with Z-Score, handle
            smaPeriods = smaPeriods == 0 ? 1 : smaPeriods;

            IEnumerable<StdDevResult> results =
                quotes.GetStdDev(lookbackPeriods, smaPeriods)
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
        int lookbackPeriods,
        int signalPeriods)
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
        int smoothPeriods)
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
        int lookbackPeriods,
        double multiplier)
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

    [HttpGet("ULCER")]
    public IActionResult GetUlcer(
        int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = FetchQuotes.Get();

            IEnumerable<UlcerIndexResult> results =
                quotes.GetUlcerIndex(lookbackPeriods)
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
        int lookbackPeriods)
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
