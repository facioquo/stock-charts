using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Skender.Stock.Indicators;
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
            return Indicator.GetSma(history, lookbackPeriod);
        }


        [HttpGet("EMA/{lookbackPeriod}")]
        public IEnumerable<EmaResult> GetEMA([FromRoute] int lookbackPeriod)
        {
            IEnumerable<Quote> history = HistoryService.GetHistory();
            return Indicator.GetEma(history, lookbackPeriod);
        }

    }
}
