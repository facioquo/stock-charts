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
        internal static readonly IEnumerable<Quote> quotes = FetchQuotes.Get();
        internal static readonly DateTime dateStart = DateTime.Parse("6/1/2018");

        [HttpGet]
        public string Get()
        {
            return "API is functioning nominally.";
        }

        [HttpGet("history")]
        public IEnumerable<Quote> GetQuotes()
        {
            return quotes
                .Where(x => x.Date >= dateStart);
        }


        //////////////////////////////////////////
        // INDICATORS (sorted alphabetically)

        [HttpGet("BB")]
        public IEnumerable<BollingerBandsResult> GetBollingerBands(
             int lookbackPeriods, double standardDeviations)
        {
            return quotes.GetBollingerBands(lookbackPeriods, standardDeviations)
                .Where(x => x.Date >= dateStart);
        }

        [HttpGet("EMA")]
        public IEnumerable<EmaResult> GetEMA(int lookbackPeriods)
        {
            return quotes.GetEma(lookbackPeriods)
                .Where(x => x.Date >= dateStart);
        }

        [HttpGet("PSAR")]
        public IEnumerable<ParabolicSarResult> GetParabolicSar(
             decimal accelerationStep, decimal maxAccelerationFactor)
        {
            return quotes.GetParabolicSar(accelerationStep, maxAccelerationFactor)
                .Where(x => x.Date >= dateStart);
        }

        [HttpGet("RSI")]
        public IEnumerable<RsiResult> GetRsi(int lookbackPeriods)
        {
            return quotes.GetRsi(lookbackPeriods)
                .Where(x => x.Date >= dateStart);
        }

        [HttpGet("STOCH")]
        public IEnumerable<StochResult> GetStoch(
             int lookbackPeriods, int signalPeriods)
        {
            return quotes.GetStoch(lookbackPeriods, signalPeriods)
                .Where(x => x.Date >= dateStart);
        }
    }
}
