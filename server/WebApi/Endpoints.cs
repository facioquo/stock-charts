using Microsoft.AspNetCore.Mvc;
using WebApi.Services;

namespace WebApi.Controllers;

[ApiController]
[Route("")]
public class Main(IQuoteService quoteService) : ControllerBase
{
    private readonly IQuoteService quoteFeed = quoteService;

    // GLOBALS
    private const int limitLast = 120;

    [HttpGet]
    public string Get()
        => "API is functioning nominally.";

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
        Response.Headers.ETag = "YYYY.MM.DD"; // replaced in build deployment
        Response.Headers.LastModified = DateTime.UtcNow.ToString("R");

        return Ok(Metadata.IndicatorListing($"{Request.Scheme}://{Request.Host}"));
    }

    private async Task<IActionResult> Get<T>(Func<IEnumerable<Quote>, IEnumerable<T>> indicatorFunc)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();
            IEnumerable<T> results = indicatorFunc(quotes).TakeLast(limitLast);
            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    //////////////////////////////////////////
    // INDICATORS (sorted alphabetically)

    [HttpGet("ADL")]
    public Task<IActionResult> GetAdl(int smaPeriods)
        => Get(quotes => quotes.GetAdl(smaPeriods));

    [HttpGet("ADX")]
    public Task<IActionResult> GetAdx(int lookbackPeriods)
        => Get(quotes => quotes.GetAdx(lookbackPeriods));

    [HttpGet("ALLIGATOR")]
    public Task<IActionResult> GetAlligator(int jawPeriods, int jawOffset, int teethPeriods, int teethOffset, int lipsPeriods, int lipsOffset)
        => Get(quotes => quotes.GetAlligator(jawPeriods, jawOffset, teethPeriods, teethOffset, lipsPeriods, lipsOffset));

    [HttpGet("ALMA")]
    public Task<IActionResult> GetAlma(int lookbackPeriods, double offset, double sigma)
        => Get(quotes => quotes.GetAlma(lookbackPeriods, offset, sigma));

    [HttpGet("AROON")]
    public Task<IActionResult> GetAroon(int lookbackPeriods)
        => Get(quotes => quotes.GetAroon(lookbackPeriods));

    [HttpGet("ATR")]
    public Task<IActionResult> GetAtr(int lookbackPeriods)
        => Get(quotes => quotes.GetAtr(lookbackPeriods));

    [HttpGet("ATR-STOP-CLOSE")]
    public Task<IActionResult> GetAtrStopClose(int lookbackPeriods, double multiplier)
        => Get(quotes => quotes.GetAtrStop(lookbackPeriods, multiplier, EndType.Close));

    [HttpGet("ATR-STOP-HL")]
    public Task<IActionResult> GetAtrStopHL(int lookbackPeriods, double multiplier)
        => Get(quotes => quotes.GetAtrStop(lookbackPeriods, multiplier, EndType.HighLow));

    [HttpGet("AWESOME")]
    public Task<IActionResult> GetAwesome(int fastPeriods, int slowPeriods)
        => Get(quotes => quotes.GetAwesome(fastPeriods, slowPeriods));

    [HttpGet("BB")]
    public Task<IActionResult> GetBollingerBands(int lookbackPeriods, double standardDeviations)
        => Get(quotes => quotes.GetBollingerBands(lookbackPeriods, standardDeviations));

    [HttpGet("BETA")]
    public async Task<IActionResult> GetBeta(int lookbackPeriods, BetaType type)
    {
        try
        {
            IEnumerable<Quote> quotes = await quoteFeed.Get();
            IEnumerable<Quote> market = await quoteFeed.Get("SPY");
            IEnumerable<BetaResult> results = quotes.GetBeta(market, lookbackPeriods, type).TakeLast(limitLast);
            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("BOP")]
    public Task<IActionResult> GetBop(int smoothPeriods)
        => Get(quotes => quotes.GetBop(smoothPeriods));

    [HttpGet("CCI")]
    public Task<IActionResult> GetCci(int lookbackPeriods)
        => Get(quotes => quotes.GetCci(lookbackPeriods));

    [HttpGet("CHAIKIN")]
    public Task<IActionResult> GetChaikinOsc(int fastPeriods, int slowPeriods)
        => Get(quotes => quotes.GetChaikinOsc(fastPeriods, slowPeriods));

    [HttpGet("CHEXIT-LONG")]
    public Task<IActionResult> GetChandelierLong(int lookbackPeriods, double multiplier)
        => Get(quotes => quotes.GetChandelier(lookbackPeriods, multiplier, ChandelierType.Long));

    [HttpGet("CHEXIT-SHORT")]
    public Task<IActionResult> GetChandelierShort(int lookbackPeriods, double multiplier)
        => Get(quotes => quotes.GetChandelier(lookbackPeriods, multiplier, ChandelierType.Short));

    [HttpGet("CHOP")]
    public Task<IActionResult> GetChop(int lookbackPeriods)
        => Get(quotes => quotes.GetChop(lookbackPeriods));

    [HttpGet("CMF")]
    public Task<IActionResult> GetCmf(int lookbackPeriods)
        => Get(quotes => quotes.GetCmf(lookbackPeriods));

    [HttpGet("CMO")]
    public Task<IActionResult> GetCmo(int lookbackPeriods)
        => Get(quotes => quotes.GetCmo(lookbackPeriods));

    [HttpGet("CRSI")]
    public Task<IActionResult> GetConnorsRsi(int rsiPeriods, int streakPeriods, int rankPeriods)
        => Get(quotes => quotes.GetConnorsRsi(rsiPeriods, streakPeriods, rankPeriods));

    [HttpGet("DEMA")]
    public Task<IActionResult> GetDema(int lookbackPeriods)
        => Get(quotes => quotes.GetDema(lookbackPeriods));

    [HttpGet("DOJI")]
    public Task<IActionResult> GetDoji(double maxPriceChangePercent)
        => Get(quotes => quotes.GetDoji(maxPriceChangePercent));

    [HttpGet("DONCHIAN")]
    public Task<IActionResult> GetDonchian(int lookbackPeriods)
        => Get(quotes => quotes.GetDonchian(lookbackPeriods));

    [HttpGet("DPO")]
    public Task<IActionResult> GetDpo(int lookbackPeriods)
        => Get(quotes => quotes.GetDpo(lookbackPeriods));

    [HttpGet("DYN")]
    public Task<IActionResult> GetDynamic(int lookbackPeriods)
        => Get(quotes => quotes.GetDynamic(lookbackPeriods));

    [HttpGet("ELDER-RAY")]
    public Task<IActionResult> GetElderRay(int lookbackPeriods)
        => Get(quotes => quotes.GetElderRay(lookbackPeriods));

    [HttpGet("EMA")]
    public Task<IActionResult> GetEma(int lookbackPeriods)
        => Get(quotes => quotes.GetEma(lookbackPeriods));

    [HttpGet("EPMA")]
    public Task<IActionResult> GetEpma(int lookbackPeriods)
        => Get(quotes => quotes.GetEpma(lookbackPeriods));

    [HttpGet("FCB")]
    public Task<IActionResult> GetFcb(int windowSpan)
        => Get(quotes => quotes.GetFcb(windowSpan));

    [HttpGet("FISHER")]
    public Task<IActionResult> GetFisher(int lookbackPeriods)
        => Get(quotes => quotes.GetFisherTransform(lookbackPeriods));

    [HttpGet("FORCE")]
    public Task<IActionResult> GetForceIndex(int lookbackPeriods)
        => Get(quotes => quotes.GetForceIndex(lookbackPeriods));

    [HttpGet("FRACTAL")]
    public Task<IActionResult> GetFractal(int windowSpan)
        => Get(quotes => quotes.GetFractal(windowSpan));

    [HttpGet("GATOR")]
    public Task<IActionResult> GetGator()
        => Get(quotes => quotes.GetGator());

    [HttpGet("HMA")]
    public Task<IActionResult> GetHma(int lookbackPeriods)
        => Get(quotes => quotes.GetHma(lookbackPeriods));

    [HttpGet("HTL")]
    public Task<IActionResult> GetHTL()
        => Get(quotes => quotes.GetHtTrendline());

    [HttpGet("HURST")]
    public Task<IActionResult> GetHurst(int lookbackPeriods)
        => Get(quotes => quotes.GetHurst(lookbackPeriods));

    [HttpGet("ICHIMOKU")]
    public Task<IActionResult> GetIchimoku(int tenkanPeriods, int kijunPeriods, int senkouBPeriods)
        => Get(quotes => quotes.GetIchimoku(tenkanPeriods, kijunPeriods, senkouBPeriods));

    [HttpGet("KAMA")]
    public Task<IActionResult> GetKama(int erPeriods, int fastPeriods, int slowPeriods)
        => Get(quotes => quotes.GetKama(erPeriods, fastPeriods, slowPeriods));

    [HttpGet("KELTNER")]
    public Task<IActionResult> GetKeltner(int emaPeriods, double multiplier, int atrPeriods)
        => Get(quotes => quotes.GetKeltner(emaPeriods, multiplier, atrPeriods));

    [HttpGet("KVO")]
    public Task<IActionResult> GetKvo(int fastPeriods, int slowPeriods, int signalPeriods)
        => Get(quotes => quotes.GetKvo(fastPeriods, slowPeriods, signalPeriods));

    [HttpGet("MA-ENV")]
    public Task<IActionResult> GetMaEnvelopes(int lookbackPeriods, double percentOffset)
        => Get(quotes => quotes.GetMaEnvelopes(lookbackPeriods, percentOffset));

    [HttpGet("MACD")]
    public Task<IActionResult> GetMacd(int fastPeriods, int slowPeriods, int signalPeriods)
        => Get(quotes => quotes.GetMacd(fastPeriods, slowPeriods, signalPeriods));

    [HttpGet("MAMA")]
    public Task<IActionResult> GetMama(double fastLimit, double slowLimit)
        => Get(quotes => quotes.GetMama(fastLimit, slowLimit));

    [HttpGet("MARUBOZU")]
    public Task<IActionResult> GetMarubozu(double minBodyPercent)
        => Get(quotes => quotes.GetMarubozu(minBodyPercent));

    [HttpGet("MFI")]
    public Task<IActionResult> GetMfi(int lookbackPeriods)
        => Get(quotes => quotes.GetMfi(lookbackPeriods));

    [HttpGet("OBV")]
    public Task<IActionResult> GetObv(int smaPeriods)
        => Get(quotes => quotes.GetObv(smaPeriods == 0 ? null : smaPeriods));

    [HttpGet("PMO")]
    public Task<IActionResult> GetPmo(int timePeriods, int smoothPeriods, int signalPeriods)
        => Get(quotes => quotes.GetPmo(timePeriods, smoothPeriods, signalPeriods));

    [HttpGet("PSAR")]
    public Task<IActionResult> GetParabolicSar(double accelerationStep, double maxAccelerationFactor)
        => Get(quotes => quotes.GetParabolicSar(accelerationStep, maxAccelerationFactor));

    [HttpGet("PVO")]
    public Task<IActionResult> GetPvo(int fastPeriods, int slowPeriods, int signalPeriods)
        => Get(quotes => quotes.GetPvo(fastPeriods, slowPeriods, signalPeriods));

    [HttpGet("ROC")]
    public Task<IActionResult> GetRoc(int lookbackPeriods, int smaPeriods)
        => Get(quotes => quotes.GetRoc(lookbackPeriods, smaPeriods));

    [HttpGet("ROCWB")]
    public Task<IActionResult> GetRocWb(int lookbackPeriods, int emaPeriods, int stdDevPeriods)
        => Get(quotes => quotes.GetRocWb(lookbackPeriods, emaPeriods, stdDevPeriods));

    [HttpGet("RSI")]
    public Task<IActionResult> GetRsi(int lookbackPeriods)
        => Get(quotes => quotes.GetRsi(lookbackPeriods));

    [HttpGet("SLOPE")]
    public Task<IActionResult> GetSlope(int lookbackPeriods)
        => Get(quotes => quotes.GetSlope(lookbackPeriods));

    [HttpGet("SMA")]
    public Task<IActionResult> GetSma(int lookbackPeriods)
        => Get(quotes => quotes.GetSma(lookbackPeriods));

    [HttpGet("SMI")]
    public Task<IActionResult> GetSmi(int lookbackPeriods, int firstSmoothPeriods, int secondSmoothPeriods, int signalPeriods)
        => Get(quotes => quotes.GetSmi(lookbackPeriods, firstSmoothPeriods, secondSmoothPeriods, signalPeriods));

    [HttpGet("SMMA")]
    public Task<IActionResult> GetSmma(int lookbackPeriods)
        => Get(quotes => quotes.GetSmma(lookbackPeriods));

    [HttpGet("STARC")]
    public Task<IActionResult> GetStarc(int smaPeriods, double multiplier, int atrPeriods)
        => Get(quotes => quotes.GetStarcBands(smaPeriods, multiplier, atrPeriods));

    [HttpGet("STC")]
    public Task<IActionResult> GetStc(int cyclePeriods, int fastPeriods, int slowPeriods)
        => Get(quotes => quotes.GetStc(cyclePeriods, fastPeriods, slowPeriods));

    [HttpGet("STDEV")]
    public Task<IActionResult> GetStdDev(int lookbackPeriods, int smaPeriods)
        => Get(quotes => quotes.GetStdDev(lookbackPeriods, smaPeriods == 0 ? 1 : smaPeriods));

    [HttpGet("STDEV-CH")]
    public Task<IActionResult> GetStdDevChannels(int lookbackPeriods, double standardDeviations)
        => Get(quotes => quotes.GetStdDevChannels(lookbackPeriods, standardDeviations));

    [HttpGet("STO")]
    public Task<IActionResult> GetStoch(int lookbackPeriods, int signalPeriods)
        => Get(quotes => quotes.GetStoch(lookbackPeriods, signalPeriods));

    [HttpGet("STORSI")]
    public Task<IActionResult> GetStochRsi(int rsiPeriods, int stochPeriods, int signalPeriods, int smoothPeriods)
        => Get(quotes => quotes.GetStochRsi(rsiPeriods, stochPeriods, signalPeriods, smoothPeriods));

    [HttpGet("SUPERTREND")]
    public Task<IActionResult> GetSuperTrend(int lookbackPeriods, double multiplier)
        => Get(quotes => quotes.GetSuperTrend(lookbackPeriods, multiplier));

    [HttpGet("T3")]
    public Task<IActionResult> GetT3(int lookbackPeriods, double volumeFactor)
        => Get(quotes => quotes.GetT3(lookbackPeriods, volumeFactor));

    [HttpGet("TEMA")]
    public Task<IActionResult> GetTema(int lookbackPeriods)
        => Get(quotes => quotes.GetTema(lookbackPeriods));

    [HttpGet("TRIX")]
    public Task<IActionResult> GetTrix(int lookbackPeriods, int signalPeriods)
        => Get(quotes => quotes.GetTrix(lookbackPeriods, signalPeriods == 0 ? null : signalPeriods));

    [HttpGet("TSI")]
    public Task<IActionResult> GetTsi(int lookbackPeriods, int smoothPeriods, int signalPeriods)
        => Get(quotes => quotes.GetTsi(lookbackPeriods, smoothPeriods, signalPeriods));

    [HttpGet("ULCER")]
    public Task<IActionResult> GetUlcer(int lookbackPeriods)
        => Get(quotes => quotes.GetUlcerIndex(lookbackPeriods));

    [HttpGet("ULTIMATE")]
    public Task<IActionResult> GetUltimate(int shortPeriods, int middlePeriods, int longPeriods)
        => Get(quotes => quotes.GetUltimate(shortPeriods, middlePeriods, longPeriods));

    [HttpGet("VOL-STOP")]
    public Task<IActionResult> GetVolatilityStop(int lookbackPeriods, double multiplier)
        => Get(quotes => quotes.GetVolatilityStop(lookbackPeriods, multiplier));

    [HttpGet("VORTEX")]
    public Task<IActionResult> GetVortex(int lookbackPeriods)
        => Get(quotes => quotes.GetVortex(lookbackPeriods));

    [HttpGet("VWAP")]
    public Task<IActionResult> GetVwap()
        => Get(quotes => quotes.GetVwap());

    [HttpGet("VWMA")]
    public Task<IActionResult> GetVwma(int lookbackPeriods)
        => Get(quotes => quotes.GetVwma(lookbackPeriods));

    [HttpGet("WILLIAMSR")]
    public Task<IActionResult> GetWilliamsR(int lookbackPeriods)
        => Get(quotes => quotes.GetWilliamsR(lookbackPeriods));

    [HttpGet("WMA")]
    public Task<IActionResult> GetWma(int lookbackPeriods)
        => Get(quotes => quotes.GetWma(lookbackPeriods));

    [HttpGet("ZIGZAG-CLOSE")]
    public Task<IActionResult> GetZigZagClose(decimal percentChange)
        => Get(quotes => quotes.GetZigZag(EndType.Close, percentChange));

    [HttpGet("ZIGZAG-HIGHLOW")]
    public Task<IActionResult> GetZigZagHighLow(decimal percentChange)
        => Get(quotes => quotes.GetZigZag(EndType.HighLow, percentChange));
}
