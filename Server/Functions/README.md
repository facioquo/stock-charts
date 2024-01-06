# About Functions

## ENVIRONMENT VARIABLES for local dev

These can be set as either environment variables or project scoped User Secrets.

```bash
setx AzureWebJobsStorage "UseDevelopmentStorage=true"
setx AlpacaApiKey "YOUR ALPACA API KEY"
setx AlpacaSecret "YOUR ALPACA SECRET KEY"
```

## CRON

<https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-timer#cron-expressions>

## TIME ZONE

Azure App Service server app settings on the server:
`TZ` : `America/New_York` for Linux instance.

This is often documented as `WEBSITE_TIME_ZONE` : `Eastern Standard Time` for Windows instances.

This is set in the Azure App Service settings online and potentially in the Release settings, not in any local settings files.
