using Microsoft.AspNetCore.Mvc;
using WebApi.Services;

namespace WebApi.Controllers;

[ApiController]
[Route("")]
public class MainController(QuoteService quoteService) : ControllerBase
{
    private readonly QuoteService quoteFeed = quoteService;

    // GLOBALS
    internal static readonly int limitLast = 120;

    [HttpGet]
    public string Get() => "API is functioning nominally.";

    [HttpGet("quotes")]
    public async Task<IActionResult> GetQuotes()
    {
        IEnumerable<Quote> quotes = await quoteFeed.Get();
        return Ok(quotes.TakeLast(limitLast));
    }

    [HttpGet("indicators")]
    public IActionResult GetIndicatorCatalog()
    {
        Response.Headers.CacheControl = "public, max-age=3600"; // 1 hour TTL
        Response.Headers.ETag = "YYYY.MM.DD"; // only changes with deployment
        Response.Headers.LastModified = DateTime.UtcNow.ToString("R");

        return Ok(Metadata.IndicatorListing($"{Request.Scheme}://{Request.Host}"));
    }


    //////////////////////////////////////////
    // INDICATORS (sorted alphabetically)

    [HttpGet("ADL")]
    public async Task<IActionResult> GetAdl(
        int smaPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetAdx(
        int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetAlma(
        int lookbackPeriods,
        double offset,
        double sigma)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetAlligator(
        int jawPeriods,
        int jawOffset,
        int teethPeriods,
        int teethOffset,
        int lipsPeriods,
        int lipsOffset)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetAroon(
        int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetAtr(
        int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetAtrStopClose(
        int lookbackPeriods,
        double multiplier)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetAtrStopHL(
        int lookbackPeriods,
        double multiplier)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetBollingerBands(
        int lookbackPeriods,
        double standardDeviations)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetBeta(
        int lookbackPeriods,
        BetaType type)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();
            IEnumerable<Quote> market = await quoteFeed.Get("SPY");

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
    public async Task<IActionResult> GetChandelierLong(
        int lookbackPeriods,
        double multiplier)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetChandelierShort(
        int lookbackPeriods,
        double multiplier)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetChop(
        int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetCmf(
        int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetCmo(
        int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetConnorsRsi(
        int rsiPeriods,
        int streakPeriods,
        int rankPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetDoji(
        double maxPriceChangePercent)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetDonchian(
        int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetDynamic(
        int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetElderRay(
        int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetEpma(
        int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetEma(
        int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetFcb(
        int windowSpan)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetFisher(
        int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetFractal(
        int windowSpan)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetGator()
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetHTL()
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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

    [HttpGet("ICHIMOKU")]
    public async Task<IActionResult> GetIchimoku(
        int tenkanPeriods,
        int kijunPeriods,
        int senkouBPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

            IEnumerable<IchimokuResult> results =
                quotes.GetIchimoku(tenkanPeriods, kijunPeriods, senkouBPeriods)
                      .TakeLast(limitLast);

            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("KELTNER")]
    public async Task<IActionResult> GetKeltner(
        int emaPeriods,
        double multiplier,
        int atrPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetMacd(
        int fastPeriods,
        int slowPeriods,
        int signalPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetMarubozu(
        double minBodyPercent)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetMfi(
        int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetParabolicSar(
        double accelerationStep,
        double maxAccelerationFactor)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetRoc(
        int lookbackPeriods,
        int smaPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetRsi(
        int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetSlope(
        int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetSma(
        int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetSmi(
        int lookbackPeriods,
        int firstSmoothPeriods,
        int secondSmoothPeriods,
        int signalPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetStc(
        int cyclePeriods,
        int fastPeriods,
        int slowPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetStarc(
        int smaPeriods,
        double multiplier,
        int atrPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetStdDev(
        int lookbackPeriods,
        int smaPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetStoch(
        int lookbackPeriods,
        int signalPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetStochRsi(
        int rsiPeriods,
        int stochPeriods,
        int signalPeriods,
        int smoothPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetSuperTrend(
        int lookbackPeriods,
        double multiplier)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetUlcer(
        int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetVortex(
        int lookbackPeriods)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetZigZagClose(
        decimal percentChange)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
    public async Task<IActionResult> GetZigZagHighLow(
        decimal percentChange)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();

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
