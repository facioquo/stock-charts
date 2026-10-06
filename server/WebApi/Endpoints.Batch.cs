using System.Globalization;
using System.Reflection;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Primitives;

namespace WebApi.Controllers;

public partial class Main
{
    private const int maxBatchSelections = 50;

    // Routes of this controller that are not indicator calculations.
    private static readonly HashSet<string> nonIndicatorRoutes
        = new(["", "quotes", "indicators", "indicators/batch"], StringComparer.OrdinalIgnoreCase);

    // Indicator actions by route name, so a batch runs exactly the code a single
    // request does, with no second copy of the 90-odd endpoints to keep in step.
    private static readonly Lazy<Dictionary<string, MethodInfo>> indicatorActions = new(FindIndicatorActions);

    /// <summary>
    /// Every requested selection's rows in one call, in request order.
    /// </summary>
    /// <remarks>
    /// Each <c>s</c> value is an indicator route and its query, for example
    /// <c>s=ADX?lookbackPeriods=14&amp;s=BB?lookbackPeriods=20&amp;standardDeviations=2</c>
    /// (URL-encoded). The response is 200 only when every selection succeeded;
    /// otherwise 207, so a partial result is never cached as the answer.
    /// </remarks>
    [HttpGet("indicators/batch")]
    public async Task<IActionResult> GetIndicatorBatch([FromQuery(Name = "s")] string[]? selections)
    {
        if (selections is null || selections.Length == 0)
        {
            return BadRequest("Provide at least one selection as s=<indicator>?<parameters>.");
        }

        if (selections.Length > maxBatchSelections)
        {
            return BadRequest($"At most {maxBatchSelections} selections per request.");
        }

        // Sequential: the quote feed is cached in memory, so concurrency would
        // buy nothing and the actions share this response.
        List<BatchItem> items = [];

        foreach (string selection in selections)
        {
            items.Add(await RunSelection(selection));
        }

        if (items.All(item => item.Status == StatusCodes.Status200OK))
        {
            return Ok(items);
        }

        Response.Headers.Remove("Cache-Control");
        return StatusCode(StatusCodes.Status207MultiStatus, items);
    }

    private async Task<BatchItem> RunSelection(string selection)
    {
        int split = selection.IndexOf('?', StringComparison.Ordinal);
        string name = (split < 0 ? selection : selection[..split]).Trim('/');

        if (!indicatorActions.Value.TryGetValue(name, out MethodInfo? action))
        {
            return new BatchItem(StatusCodes.Status404NotFound, null, $"Unknown indicator '{name}'.");
        }

        Dictionary<string, StringValues> query = new(StringComparer.OrdinalIgnoreCase);

        if (split >= 0)
        {
            foreach (KeyValuePair<string, StringValues> pair in QueryHelpers.ParseQuery(selection[split..]))
            {
                query[pair.Key] = pair.Value;
            }
        }

        if (!TryBind(action, query, out object?[] arguments, out string error))
        {
            return new BatchItem(StatusCodes.Status400BadRequest, null, error);
        }

        IActionResult result = await (Task<IActionResult>)action.Invoke(this, arguments)!;

        return result switch {
            OkObjectResult ok => new BatchItem(StatusCodes.Status200OK, ok.Value, null),
            ObjectResult failed => new BatchItem(
                failed.StatusCode ?? StatusCodes.Status500InternalServerError, null, failed.Value?.ToString()),
            StatusCodeResult status => new BatchItem(status.StatusCode, null, null),
            _ => new BatchItem(StatusCodes.Status500InternalServerError, null, "Unexpected result.")
        };
    }

    private static bool TryBind(
        MethodInfo action,
        Dictionary<string, StringValues> query,
        out object?[] arguments,
        out string error)
    {
        ParameterInfo[] parameters = action.GetParameters();
        arguments = new object?[parameters.Length];
        error = string.Empty;

        for (int i = 0; i < parameters.Length; i++)
        {
            ParameterInfo parameter = parameters[i];

            if (!query.TryGetValue(parameter.Name!, out StringValues value) || value.Count == 0)
            {
                error = $"Missing parameter '{parameter.Name}'.";
                return false;
            }

            if (!TryConvert(value.ToString(), parameter.ParameterType, out arguments[i]))
            {
                error = $"Invalid value for parameter '{parameter.Name}'.";
                return false;
            }
        }

        return true;
    }

    private static bool TryConvert(string text, Type type, out object? value)
    {
        value = null;

        try
        {
            if (type.IsEnum)
            {
                if (!Enum.TryParse(type, text, ignoreCase: true, out value) || !Enum.IsDefined(type, value))
                {
                    value = null;
                    return false;
                }

                return true;
            }

            value = Convert.ChangeType(text, type, CultureInfo.InvariantCulture);
            return true;
        }
        catch (Exception ex) when (ex is FormatException or OverflowException or InvalidCastException)
        {
            return false;
        }
    }

    private static Dictionary<string, MethodInfo> FindIndicatorActions()
    {
        Dictionary<string, MethodInfo> actions = new(StringComparer.OrdinalIgnoreCase);

        foreach (MethodInfo method in typeof(Main).GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly))
        {
            string? route = method.GetCustomAttribute<HttpGetAttribute>()?.Template;

            if (route is null
                || nonIndicatorRoutes.Contains(route)
                || method.ReturnType != typeof(Task<IActionResult>))
            {
                continue;
            }

            actions[route] = method;
        }

        return actions;
    }

    /// <summary>One selection's outcome: the rows, or why there are none.</summary>
    private sealed record BatchItem(
        int Status,
        [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] object? Data,
        [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Error);
}
