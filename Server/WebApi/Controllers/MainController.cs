using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Skender.Stock.Indicators;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using WebApi.Services;

namespace WebApi.Controllers
{
    [EnableCors("CorsPolicy")]
    [ApiController]
    [Route("")]
    [SuppressMessage("Performance", "CA1822:Mark members as static")]
    public class MainController : ControllerBase
    {

        [HttpGet]
        public string Get()
        {
            return "API is functioning nominally.";
        }

        [HttpGet("history")]
        public IEnumerable<Quote> GetQuotes()
        {
            return HistoryService.GetHistory();
        }


        //////////////////////////////////////////
        // INDICATORS (sorted alphabetically)

        [HttpGet("BB/{lookbackPeriod}/{standardDeviations}")]
        public IEnumerable<BollingerBandsResult> GetBollingerBands(
            [FromRoute] int lookbackPeriod, [FromRoute] decimal standardDeviations)
        {
            IEnumerable<Quote> history = HistoryService.GetHistory();
            return Indicator.GetBollingerBands(history, lookbackPeriod, standardDeviations);
        }


        [HttpGet("EMA/{lookbackPeriod}")]
        public IEnumerable<EmaResult> GetEMA([FromRoute] int lookbackPeriod)
        {
            IEnumerable<Quote> history = HistoryService.GetHistory();
            return Indicator.GetEma(history, lookbackPeriod);
        }


        [HttpGet("PSAR/{accelerationStep}/{maxAccelerationFactor}")]
        public IEnumerable<ParabolicSarResult> GetParabolicSar(
            [FromRoute] decimal accelerationStep, [FromRoute] decimal maxAccelerationFactor)
        {
            IEnumerable<Quote> history = HistoryService.GetHistory();
            return Indicator.GetParabolicSar(history, accelerationStep, maxAccelerationFactor);
        }


        [HttpGet("SMA/{lookbackPeriod}")]
        public IEnumerable<SmaResult> GetSma([FromRoute] int lookbackPeriod)
        {
            IEnumerable<Quote> history = HistoryService.GetHistory();
            return Indicator.GetSma(history, lookbackPeriod);
        }


        [HttpGet("RSI/{lookbackPeriod}")]
        public IEnumerable<RsiResult> GetRsi([FromRoute] int lookbackPeriod)
        {
            IEnumerable<Quote> history = HistoryService.GetHistory();
            return Indicator.GetRsi(history, lookbackPeriod);
        }
    }
}
