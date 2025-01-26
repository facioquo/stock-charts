using Microsoft.AspNetCore.Mvc;
using WebApi.Services;
using WebApi.Models;

namespace WebApi.Controllers;

[ApiController]
[Route("")]
public class Main(IQuoteService quoteService) : ControllerBase
{
    private readonly IQuoteService quoteFeed = quoteService;

    // GLOBALS
    private static readonly int limitLast = 120;

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

    [HttpGet("ALMA")]
    public Task<IActionResult> GetAlma(int lookbackPeriods, double offset, double sigma)
        => Get(quotes => quotes.GetAlma(lookbackPeriods, offset, sigma));

    [HttpGet("ALLIGATOR")]
    public Task<IActionResult> GetAlligator(int jawPeriods, int jawOffset, int teethPeriods, int teethOffset, int lipsPeriods, int lipsOffset)
        => Get(quotes => quotes.GetAlligator(jawPeriods, jawOffset, teethPeriods, teethOffset, lipsPeriods, lipsOffset));

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

    [HttpGet("DOJI")]
    public Task<IActionResult> GetDoji(double maxPriceChangePercent)
        => Get(quotes => quotes.GetDoji(maxPriceChangePercent));

    [HttpGet("DONCHIAN")]
    public Task<IActionResult> GetDonchian(int lookbackPeriods)
        => Get(quotes => quotes.GetDonchian(lookbackPeriods));

    [HttpGet("DYN")]
    public Task<IActionResult> GetDynamic(int lookbackPeriods)
        => Get(quotes => quotes.GetDynamic(lookbackPeriods));

    [HttpGet("ELDER-RAY")]
    public Task<IActionResult> GetElderRay(int lookbackPeriods)
        => Get(quotes => quotes.GetElderRay(lookbackPeriods));

    [HttpGet("EPMA")]
    public Task<IActionResult> GetEpma(int lookbackPeriods)
        => Get(quotes => quotes.GetEpma(lookbackPeriods));

    [HttpGet("EMA")]
    public Task<IActionResult> GetEma(int lookbackPeriods)
        => Get(quotes => quotes.GetEma(lookbackPeriods));

    [HttpGet("FCB")]
    public Task<IActionResult> GetFcb(int windowSpan)
        => Get(quotes => quotes.GetFcb(windowSpan));

    [HttpGet("FISHER")]
    public Task<IActionResult> GetFisher(int lookbackPeriods)
        => Get(quotes => quotes.GetFisherTransform(lookbackPeriods));

    [HttpGet("FRACTAL")]
    public Task<IActionResult> GetFractal(int windowSpan)
        => Get(quotes => quotes.GetFractal(windowSpan));

    [HttpGet("GATOR")]
    public Task<IActionResult> GetGator()
        => Get(quotes => quotes.GetGator());

    [HttpGet("HTL")]
    public Task<IActionResult> GetHTL()
        => Get(quotes => quotes.GetHtTrendline());

    [HttpGet("ICHIMOKU")]
    public Task<IActionResult> GetIchimoku(int tenkanPeriods, int kijunPeriods, int senkouBPeriods)
        => Get(quotes => quotes.GetIchimoku(tenkanPeriods, kijunPeriods, senkouBPeriods));

    [HttpGet("KELTNER")]
    public Task<IActionResult> GetKeltner(int emaPeriods, double multiplier, int atrPeriods)
        => Get(quotes => quotes.GetKeltner(emaPeriods, multiplier, atrPeriods));

    [HttpGet("MACD")]
    public Task<IActionResult> GetMacd(int fastPeriods, int slowPeriods, int signalPeriods)
        => Get(quotes => quotes.GetMacd(fastPeriods, slowPeriods, signalPeriods));

    [HttpGet("MARUBOZU")]
    public Task<IActionResult> GetMarubozu(double minBodyPercent)
        => Get(quotes => quotes.GetMarubozu(minBodyPercent));

    [HttpGet("MFI")]
    public Task<IActionResult> GetMfi(int lookbackPeriods)
        => Get(quotes => quotes.GetMfi(lookbackPeriods));

    [HttpGet("PSAR")]
    public Task<IActionResult> GetParabolicSar(double accelerationStep, double maxAccelerationFactor)
        => Get(quotes => quotes.GetParabolicSar(accelerationStep, maxAccelerationFactor));

    [HttpGet("ROC")]
    public Task<IActionResult> GetRoc(int lookbackPeriods, int smaPeriods)
        => Get(quotes => quotes.GetRoc(lookbackPeriods, smaPeriods));

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

    [HttpGet("STC")]
    public Task<IActionResult> GetStc(int cyclePeriods, int fastPeriods, int slowPeriods)
        => Get(quotes => quotes.GetStc(cyclePeriods, fastPeriods, slowPeriods));

    [HttpGet("STARC")]
    public Task<IActionResult> GetStarc(int smaPeriods, double multiplier, int atrPeriods)
        => Get(quotes => quotes.GetStarcBands(smaPeriods, multiplier, atrPeriods));

    [HttpGet("STDEV")]
    public Task<IActionResult> GetStdDev(int lookbackPeriods, int smaPeriods)
        => Get(quotes => quotes.GetStdDev(lookbackPeriods, smaPeriods == 0 ? 1 : smaPeriods));

    [HttpGet("STO")]
    public Task<IActionResult> GetStoch(int lookbackPeriods, int signalPeriods)
        => Get(quotes => quotes.GetStoch(lookbackPeriods, signalPeriods));

    [HttpGet("STORSI")]
    public Task<IActionResult> GetStochRsi(int rsiPeriods, int stochPeriods, int signalPeriods, int smoothPeriods)
        => Get(quotes => quotes.GetStochRsi(rsiPeriods, stochPeriods, signalPeriods, smoothPeriods));

    [HttpGet("SUPERTREND")]
    public Task<IActionResult> GetSuperTrend(int lookbackPeriods, double multiplier)
        => Get(quotes => quotes.GetSuperTrend(lookbackPeriods, multiplier));

    [HttpGet("ULCER")]
    public Task<IActionResult> GetUlcer(int lookbackPeriods)
        => Get(quotes => quotes.GetUlcerIndex(lookbackPeriods));

    [HttpGet("VORTEX")]
    public Task<IActionResult> GetVortex(int lookbackPeriods)
        => Get(quotes => quotes.GetVortex(lookbackPeriods));

    [HttpGet("ZIGZAG-CLOSE")]
    public Task<IActionResult> GetZigZagClose(decimal percentChange)
        => Get(quotes => quotes.GetZigZag(EndType.Close, percentChange));

    [HttpGet("ZIGZAG-HIGHLOW")]
    public Task<IActionResult> GetZigZagHighLow(decimal percentChange)
        => Get(quotes => quotes.GetZigZag(EndType.HighLow, percentChange));
}
