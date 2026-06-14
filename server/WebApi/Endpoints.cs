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
        IEnumerable<Quote> quotes = await quoteFeed.Get(HttpContext.RequestAborted);
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

    private async Task<IActionResult> Get<T>(Func<IReadOnlyList<Quote>, IEnumerable<T>> indicatorFunc)
    {
        try
        {
            IReadOnlyList<Quote> quotes = (await quoteFeed.Get(HttpContext.RequestAborted)).ToList();
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
    public Task<IActionResult> GetAdl()
        => Get(quotes => quotes.ToAdl());

    [HttpGet("ADX")]
    public Task<IActionResult> GetAdx(int lookbackPeriods)
        => Get(quotes => quotes.ToAdx(lookbackPeriods));

    [HttpGet("ALLIGATOR")]
    public Task<IActionResult> GetAlligator(int jawPeriods, int jawOffset, int teethPeriods, int teethOffset, int lipsPeriods, int lipsOffset)
        => Get(quotes => quotes.ToAlligator(jawPeriods, jawOffset, teethPeriods, teethOffset, lipsPeriods, lipsOffset));

    [HttpGet("ALMA")]
    public Task<IActionResult> GetAlma(int lookbackPeriods, double offset, double sigma)
        => Get(quotes => quotes.ToAlma(lookbackPeriods, offset, sigma));

    [HttpGet("AROON")]
    public Task<IActionResult> GetAroon(int lookbackPeriods)
        => Get(quotes => quotes.ToAroon(lookbackPeriods));

    [HttpGet("ATR")]
    public Task<IActionResult> GetAtr(int lookbackPeriods)
        => Get(quotes => quotes.ToAtr(lookbackPeriods));

    [HttpGet("ATR-STOP-CLOSE")]
    public Task<IActionResult> GetAtrStopClose(int lookbackPeriods, double multiplier)
        => Get(quotes => quotes.ToAtrStop(lookbackPeriods, multiplier, EndType.Close));

    [HttpGet("ATR-STOP-HL")]
    public Task<IActionResult> GetAtrStopHL(int lookbackPeriods, double multiplier)
        => Get(quotes => quotes.ToAtrStop(lookbackPeriods, multiplier, EndType.HighLow));

    [HttpGet("AWESOME")]
    public Task<IActionResult> GetAwesome(int fastPeriods, int slowPeriods)
        => Get(quotes => quotes.ToAwesome(fastPeriods, slowPeriods));

    [HttpGet("BB")]
    public Task<IActionResult> GetBollingerBands(int lookbackPeriods, double standardDeviations)
        => Get(quotes => quotes.ToBollingerBands(lookbackPeriods, standardDeviations));

    [HttpGet("BETA")]
    public async Task<IActionResult> GetBeta(int lookbackPeriods, BetaType type)
    {
        try
        {
            IReadOnlyList<Quote> quotes = (await quoteFeed.Get(HttpContext.RequestAborted)).ToList();
            IReadOnlyList<Quote> market = (await quoteFeed.Get("SPY", HttpContext.RequestAborted)).ToList();
            IEnumerable<BetaResult> results = quotes.ToBeta(market, lookbackPeriods, type).TakeLast(limitLast);
            return Ok(results);
        }
        catch (ArgumentOutOfRangeException rex)
        {
            return BadRequest(rex.Message);
        }
    }

    [HttpGet("BOP")]
    public Task<IActionResult> GetBop(int smoothPeriods)
        => Get(quotes => quotes.ToBop(smoothPeriods));

    [HttpGet("CCI")]
    public Task<IActionResult> GetCci(int lookbackPeriods)
        => Get(quotes => quotes.ToCci(lookbackPeriods));

    [HttpGet("CHAIKIN")]
    public Task<IActionResult> GetChaikinOsc(int fastPeriods, int slowPeriods)
        => Get(quotes => quotes.ToChaikinOsc(fastPeriods, slowPeriods));

    [HttpGet("CHEXIT-LONG")]
    public Task<IActionResult> GetChandelierLong(int lookbackPeriods, double multiplier)
        => Get(quotes => quotes.ToChandelier(lookbackPeriods, multiplier, Direction.Long));

    [HttpGet("CHEXIT-SHORT")]
    public Task<IActionResult> GetChandelierShort(int lookbackPeriods, double multiplier)
        => Get(quotes => quotes.ToChandelier(lookbackPeriods, multiplier, Direction.Short));

    [HttpGet("CHOP")]
    public Task<IActionResult> GetChop(int lookbackPeriods)
        => Get(quotes => quotes.ToChop(lookbackPeriods));

    [HttpGet("CMF")]
    public Task<IActionResult> GetCmf(int lookbackPeriods)
        => Get(quotes => quotes.ToCmf(lookbackPeriods));

    [HttpGet("CMO")]
    public Task<IActionResult> GetCmo(int lookbackPeriods)
        => Get(quotes => quotes.ToCmo(lookbackPeriods));

    [HttpGet("CRSI")]
    public Task<IActionResult> GetConnorsRsi(int rsiPeriods, int streakPeriods, int rankPeriods)
        => Get(quotes => quotes.ToConnorsRsi(rsiPeriods, streakPeriods, rankPeriods));

    [HttpGet("DEMA")]
    public Task<IActionResult> GetDema(int lookbackPeriods)
        => Get(quotes => quotes.ToDema(lookbackPeriods));

    [HttpGet("DOJI")]
    public Task<IActionResult> GetDoji(double maxPriceChangePercent)
        => Get(quotes => quotes.ToDoji(maxPriceChangePercent));

    [HttpGet("DONCHIAN")]
    public Task<IActionResult> GetDonchian(int lookbackPeriods)
        => Get(quotes => quotes.ToDonchian(lookbackPeriods));

    [HttpGet("DPO")]
    public Task<IActionResult> GetDpo(int lookbackPeriods)
        => Get(quotes => quotes.ToDpo(lookbackPeriods));

    [HttpGet("DYN")]
    public Task<IActionResult> GetDynamic(int lookbackPeriods)
        => Get(quotes => quotes.ToDynamic(lookbackPeriods));

    [HttpGet("ELDER-RAY")]
    public Task<IActionResult> GetElderRay(int lookbackPeriods)
        => Get(quotes => quotes.ToElderRay(lookbackPeriods));

    [HttpGet("EMA")]
    public Task<IActionResult> GetEma(int lookbackPeriods)
        => Get(quotes => quotes.ToEma(lookbackPeriods));

    [HttpGet("EPMA")]
    public Task<IActionResult> GetEpma(int lookbackPeriods)
        => Get(quotes => quotes.ToEpma(lookbackPeriods));

    [HttpGet("FCB")]
    public Task<IActionResult> GetFcb(int windowSpan)
        => Get(quotes => quotes.ToFcb(windowSpan));

    [HttpGet("FISHER")]
    public Task<IActionResult> GetFisher(int lookbackPeriods)
        => Get(quotes => quotes.ToFisherTransform(lookbackPeriods));

    [HttpGet("FORCE")]
    public Task<IActionResult> GetForceIndex(int lookbackPeriods)
        => Get(quotes => quotes.ToForceIndex(lookbackPeriods));

    [HttpGet("FRACTAL")]
    public Task<IActionResult> GetFractal(int windowSpan)
        => Get(quotes => quotes.ToFractal(windowSpan));

    [HttpGet("GATOR")]
    public Task<IActionResult> GetGator()
        => Get(quotes => quotes.ToGator());

    [HttpGet("HMA")]
    public Task<IActionResult> GetHma(int lookbackPeriods)
        => Get(quotes => quotes.ToHma(lookbackPeriods));

    [HttpGet("HTL")]
    public Task<IActionResult> GetHTL()
        => Get(quotes => quotes.ToHtTrendline());

    [HttpGet("HURST")]
    public Task<IActionResult> GetHurst(int lookbackPeriods)
        => Get(quotes => quotes.ToHurst(lookbackPeriods));

    [HttpGet("ICHIMOKU")]
    public Task<IActionResult> GetIchimoku(int tenkanPeriods, int kijunPeriods, int senkouBPeriods)
        => Get(quotes => quotes.ToIchimoku(tenkanPeriods, kijunPeriods, senkouBPeriods));

    [HttpGet("KAMA")]
    public Task<IActionResult> GetKama(int erPeriods, int fastPeriods, int slowPeriods)
        => Get(quotes => quotes.ToKama(erPeriods, fastPeriods, slowPeriods));

    [HttpGet("KELTNER")]
    public Task<IActionResult> GetKeltner(int emaPeriods, double multiplier, int atrPeriods)
        => Get(quotes => quotes.ToList().ToKeltner(emaPeriods, multiplier, atrPeriods));

    [HttpGet("KVO")]
    public Task<IActionResult> GetKvo(int fastPeriods, int slowPeriods, int signalPeriods)
        => Get(quotes => quotes.ToKvo(fastPeriods, slowPeriods, signalPeriods));

    [HttpGet("MA-ENV")]
    public Task<IActionResult> GetMaEnvelopes(int lookbackPeriods, double percentOffset)
        => Get(quotes => quotes.ToMaEnvelopes(lookbackPeriods, percentOffset));

    [HttpGet("MACD")]
    public Task<IActionResult> GetMacd(int fastPeriods, int slowPeriods, int signalPeriods)
        => Get(quotes => quotes.ToMacd(fastPeriods, slowPeriods, signalPeriods));

    [HttpGet("MAMA")]
    public Task<IActionResult> GetMama(double fastLimit, double slowLimit)
        => Get(quotes => quotes.ToMama(fastLimit, slowLimit));

    [HttpGet("MARUBOZU")]
    public Task<IActionResult> GetMarubozu(double minBodyPercent)
        => Get(quotes => quotes.ToMarubozu(minBodyPercent));

    [HttpGet("MFI")]
    public Task<IActionResult> GetMfi(int lookbackPeriods)
        => Get(quotes => quotes.ToMfi(lookbackPeriods));

    [HttpGet("OBV")]
    public Task<IActionResult> GetObv()
        => Get(quotes => quotes.ToObv());

    [HttpGet("PMO")]
    public Task<IActionResult> GetPmo(int timePeriods, int smoothPeriods, int signalPeriods)
        => Get(quotes => quotes.ToPmo(timePeriods, smoothPeriods, signalPeriods));

    [HttpGet("PSAR")]
    public Task<IActionResult> GetParabolicSar(double accelerationStep, double maxAccelerationFactor)
        => Get(quotes => quotes.ToParabolicSar(accelerationStep, maxAccelerationFactor));

    [HttpGet("PVO")]
    public Task<IActionResult> GetPvo(int fastPeriods, int slowPeriods, int signalPeriods)
        => Get(quotes => quotes.ToPvo(fastPeriods, slowPeriods, signalPeriods));

    [HttpGet("ROC")]
    public Task<IActionResult> GetRoc(int lookbackPeriods)
        => Get(quotes => quotes.ToRoc(lookbackPeriods));

    [HttpGet("ROCWB")]
    public Task<IActionResult> GetRocWb(int lookbackPeriods, int emaPeriods, int stdDevPeriods)
        => Get(quotes => quotes.ToRocWb(lookbackPeriods, emaPeriods, stdDevPeriods));

    [HttpGet("RSI")]
    public Task<IActionResult> GetRsi(int lookbackPeriods)
        => Get(quotes => quotes.ToRsi(lookbackPeriods));

    [HttpGet("SLOPE")]
    public Task<IActionResult> GetSlope(int lookbackPeriods)
        => Get(quotes => quotes.ToSlope(lookbackPeriods));

    [HttpGet("SMA")]
    public Task<IActionResult> GetSma(int lookbackPeriods)
        => Get(quotes => quotes.ToSma(lookbackPeriods));

    [HttpGet("SMI")]
    public Task<IActionResult> GetSmi(int lookbackPeriods, int firstSmoothPeriods, int secondSmoothPeriods, int signalPeriods)
        => Get(quotes => quotes.ToSmi(lookbackPeriods, firstSmoothPeriods, secondSmoothPeriods, signalPeriods));

    [HttpGet("SMMA")]
    public Task<IActionResult> GetSmma(int lookbackPeriods)
        => Get(quotes => quotes.ToSmma(lookbackPeriods));

    [HttpGet("STARC")]
    public Task<IActionResult> GetStarc(int smaPeriods, double multiplier, int atrPeriods)
        => Get(quotes => quotes.ToStarcBands(smaPeriods, multiplier, atrPeriods));

    [HttpGet("STC")]
    public Task<IActionResult> GetStc(int cyclePeriods, int fastPeriods, int slowPeriods)
        => Get(quotes => quotes.ToStc(cyclePeriods, fastPeriods, slowPeriods));

    [HttpGet("STDEV")]
    public Task<IActionResult> GetStdDev(int lookbackPeriods)
        => Get(quotes => quotes.ToStdDev(lookbackPeriods));

    [HttpGet("STDEV-CH")]
    public Task<IActionResult> GetStdDevChannels(int lookbackPeriods, double standardDeviations)
        => Get(quotes => quotes.ToStdDevChannels(lookbackPeriods, standardDeviations));

    [HttpGet("STO")]
    public Task<IActionResult> GetStoch(int lookbackPeriods, int signalPeriods)
        => Get(quotes => quotes.ToStoch(lookbackPeriods, signalPeriods));

    [HttpGet("STORSI")]
    public Task<IActionResult> GetStochRsi(int rsiPeriods, int stochPeriods, int signalPeriods, int smoothPeriods)
        => Get(quotes => quotes.ToStochRsi(rsiPeriods, stochPeriods, signalPeriods, smoothPeriods));

    [HttpGet("SUPERTREND")]
    public Task<IActionResult> GetSuperTrend(int lookbackPeriods, double multiplier)
        => Get(quotes => quotes.ToSuperTrend(lookbackPeriods, multiplier));

    [HttpGet("T3")]
    public Task<IActionResult> GetT3(int lookbackPeriods, double volumeFactor)
        => Get(quotes => quotes.ToT3(lookbackPeriods, volumeFactor));

    [HttpGet("TEMA")]
    public Task<IActionResult> GetTema(int lookbackPeriods)
        => Get(quotes => quotes.ToTema(lookbackPeriods));

    [HttpGet("TR")]
    public Task<IActionResult> GetTr()
        => Get(quotes => quotes.ToTr());

    [HttpGet("TRIX")]
    public Task<IActionResult> GetTrix(int lookbackPeriods)
        => Get(quotes => quotes.ToTrix(lookbackPeriods));

    [HttpGet("TSI")]
    public Task<IActionResult> GetTsi(int lookbackPeriods, int smoothPeriods, int signalPeriods)
        => Get(quotes => quotes.ToTsi(lookbackPeriods, smoothPeriods, signalPeriods));

    [HttpGet("ULCER")]
    public Task<IActionResult> GetUlcer(int lookbackPeriods)
        => Get(quotes => quotes.ToUlcerIndex(lookbackPeriods));

    [HttpGet("ULTIMATE")]
    public Task<IActionResult> GetUltimate(int shortPeriods, int middlePeriods, int longPeriods)
        => Get(quotes => quotes.ToUltimate(shortPeriods, middlePeriods, longPeriods));

    [HttpGet("VOL-STOP")]
    public Task<IActionResult> GetVolatilityStop(int lookbackPeriods, double multiplier)
        => Get(quotes => quotes.ToVolatilityStop(lookbackPeriods, multiplier));

    [HttpGet("VORTEX")]
    public Task<IActionResult> GetVortex(int lookbackPeriods)
        => Get(quotes => quotes.ToVortex(lookbackPeriods));

    // VWAP anchors to the first candle of the visible window — the same
    // limitLast slice every endpoint returns — so the line always begins at
    // the leftmost visible candle instead of accumulating from the dataset
    // origin (which detaches it from anything on screen). The empty-input
    // guard avoids calling First() on an empty slice.
    // Future: once intraday data is available, anchor per trading session
    // (daily reset) rather than to the visible window.
    [HttpGet("VWAP")]
    public Task<IActionResult> GetVwap()
        => Get(quotes => quotes.Count == 0
            ? []
            : quotes.ToVwap(quotes.TakeLast(limitLast).First().Timestamp));

    [HttpGet("VWMA")]
    public Task<IActionResult> GetVwma(int lookbackPeriods)
        => Get(quotes => quotes.ToVwma(lookbackPeriods));

    [HttpGet("WILLIAMSR")]
    public Task<IActionResult> GetWilliamsR(int lookbackPeriods)
        => Get(quotes => quotes.ToWilliamsR(lookbackPeriods));

    [HttpGet("WMA")]
    public Task<IActionResult> GetWma(int lookbackPeriods)
        => Get(quotes => quotes.ToWma(lookbackPeriods));

    [HttpGet("ZIGZAG-CLOSE")]
    public Task<IActionResult> GetZigZagClose(decimal percentChange)
        => Get(quotes => quotes.ToZigZag(EndType.Close, percentChange));

    [HttpGet("ZIGZAG-HIGHLOW")]
    public Task<IActionResult> GetZigZagHighLow(decimal percentChange)
        => Get(quotes => quotes.ToZigZag(EndType.HighLow, percentChange));
}
