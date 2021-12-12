using Microsoft.AspNetCore.Mvc;
using Skender.Stock.Indicators;
using System;
using System.Collections.Generic;
using System.Linq;
using WebApi.Services;

namespace WebApi.Controllers
{

    [ApiController]
    [Route("")]
    public class MainController : ControllerBase
    {
        internal static readonly IEnumerable<Quote> history = History.Get();
        internal static readonly DateTime dateStart = DateTime.Parse("6/1/2018");

        [HttpGet]
        public string Get()
        {
            return "API is functioning nominally.";
        }

        [HttpGet("history")]
        public IEnumerable<Quote> GetQuotes()
        {
            return history
                .Where(x => x.Date > dateStart);
        }


        //////////////////////////////////////////
        // INDICATORS (sorted alphabetically)

        [HttpGet("BB/{lookbackPeriod}/{standardDeviations}")]
        public IEnumerable<BollingerBandsResult> GetBollingerBands(
            [FromRoute] int lookbackPeriod, [FromRoute] double standardDeviations)
        {
            return Indicator.GetBollingerBands(history, lookbackPeriod, standardDeviations)
                .Where(x => x.Date >= dateStart);
        }

        [HttpGet("EMA/{lookbackPeriod}")]
        public IEnumerable<EmaResult> GetEMA([FromRoute] int lookbackPeriod)
        {
            return history.GetEma(lookbackPeriod)
                .Where(x => x.Date >= dateStart);
        }

        [HttpGet("PSAR/{accelerationStep}/{maxAccelerationFactor}")]
        public IEnumerable<ParabolicSarResult> GetParabolicSar(
            [FromRoute] decimal accelerationStep, [FromRoute] decimal maxAccelerationFactor)
        {
            return history.GetParabolicSar(accelerationStep, maxAccelerationFactor)
                .Where(x => x.Date >= dateStart);
        }

        [HttpGet("RSI/{lookbackPeriod}")]
        public IEnumerable<RsiResult> GetRsi([FromRoute] int lookbackPeriod)
        {
            return history.GetRsi(lookbackPeriod)
                .Where(x => x.Date >= dateStart);
        }

        [HttpGet("STOCH/{lookbackPeriod}/{signalPeriod}")]
        public IEnumerable<StochResult> GetStoch(
            [FromRoute] int lookbackPeriod, [FromRoute] int signalPeriod)
        {
            return history.GetStoch(lookbackPeriod, signalPeriod)
                .Where(x => x.Date >= dateStart);
        }
    }
}
