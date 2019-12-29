using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using StockIndicators;
using System.Collections.Generic;
using WebApi.Services;

namespace WebApi.Controllers
{
    [EnableCors("CorsPolicy")]
    [ApiController]
    [Route("")]
    public class MainController : ControllerBase
    {

        [HttpGet]
        public string Get()
        {
            return "API is functioning nominally.";
        }


        [HttpGet("history")]
        public IEnumerable<Quote> GetChart()
        {
            return HistoryService.GetHistory();
        }


        [HttpGet("SMA/{lookbackPeriod}")]
        public IEnumerable<SmaResult> GetSMA([FromRoute] int lookbackPeriod)
        {
            IEnumerable<Quote> history = HistoryService.GetHistory();
            return Indicators.GetSma(history, lookbackPeriod);
        }


        [HttpGet("EMA/{lookbackPeriod}")]
        public IEnumerable<EmaResult> GetEMA([FromRoute] int lookbackPeriod)
        {
            IEnumerable<Quote> history = HistoryService.GetHistory();
            return Indicators.GetEma(history, lookbackPeriod);
        }

    }
}
