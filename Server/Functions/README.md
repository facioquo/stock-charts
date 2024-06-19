# About Functions

## ENVIRONMENT VARIABLES for local dev

These can be set as either environment variables or project scoped User Secrets.

```bash
setx AzureWebJobsStorage "UseDevelopmentStorage=true"
setx ALPACA_KEY "YOUR ALPACA API KEY"
setx ALPACA_SECRET "YOUR ALPACA SECRET KEY"
```

## CRON

For our demo, we'll generally cache QQQ and SPY daily quotes every minute
during extended market hours 8am-6pm M-F U.S. eastern time with CRON `"0 */1 08-18 * * 1-5"`.

- [CRON syntax documentation](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-timer#cron-expressions)

To enable use of eastern time zone CRON values, we have configured our Azure Functions
to override the default UTC timezone; which is okay for our purposes.

## TIME ZONE

Azure App Service server app settings on Linux servers:

>`TZ` : `America/New_York` for Linux instance.

This is often documented for Windows instances servers as:

>`WEBSITE_TIME_ZONE` : `Eastern Standard Time`

This is set in the Azure App Service settings online
and not in local app settings files.
