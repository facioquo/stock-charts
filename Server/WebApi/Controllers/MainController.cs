using Microsoft.AspNetCore.Mvc;
using Skender.Stock.Indicators;
using System.Collections.Generic;
using WebApi.Services;

namespace WebApi.Controllers
{

    [ApiController]
    [Route("")]
    public class MainController : ControllerBase
    {
        internal static readonly IEnumerable<Quote> history = History.Get();

        [HttpGet]
        public string Get()
        {
            return "API is functioning nominally.";
        }

        [HttpGet("history")]
        public IEnumerable<Quote> GetQuotes()
        {
            return history;
        }


        //////////////////////////////////////////
        // INDICATORS (sorted alphabetically)

        [HttpGet("BB/{lookbackPeriod}/{standardDeviations}")]
        public IEnumerable<BollingerBandsResult> GetBollingerBands(
            [FromRoute] int lookbackPeriod, [FromRoute] decimal standardDeviations)
        {
            return Indicator.GetBollingerBands(history, lookbackPeriod, standardDeviations);
        }


        [HttpGet("EMA/{lookbackPeriod}")]
        public IEnumerable<EmaResult> GetEMA([FromRoute] int lookbackPeriod)
        {
            return Indicator.GetEma(history, lookbackPeriod);
        }


        [HttpGet("PSAR/{accelerationStep}/{maxAccelerationFactor}")]
        public IEnumerable<ParabolicSarResult> GetParabolicSar(
            [FromRoute] decimal accelerationStep, [FromRoute] decimal maxAccelerationFactor)
        {
            return Indicator.GetParabolicSar(history, accelerationStep, maxAccelerationFactor);
        }


        [HttpGet("SMA/{lookbackPeriod}")]
        public IEnumerable<SmaResult> GetSma([FromRoute] int lookbackPeriod)
        {
            return Indicator.GetSma(history, lookbackPeriod);
        }


        [HttpGet("RSI/{lookbackPeriod}")]
        public IEnumerable<RsiResult> GetRsi([FromRoute] int lookbackPeriod)
        {
            return Indicator.GetRsi(history, lookbackPeriod);
        }
    }
}
