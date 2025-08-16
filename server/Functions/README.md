# Azure Functions - Stock Charts

This Azure Functions project handles scheduled data fetching and processing for the Stock Charts application.

> **Note**: For general development setup, see the [main project README](../../README.md#development-setup).

## Local development environment variables

These can be set as either environment variables or project scoped User Secrets:

```bash
setx AzureWebJobsStorage "UseDevelopmentStorage=true"
setx ALPACA_KEY "YOUR ALPACA API KEY"
setx ALPACA_SECRET "YOUR ALPACA SECRET KEY"
```

**Azure storage**: The project uses [Azurite](../../README.md#local-storage-with-azurite) for local development, which is automatically installed via the main project's npm dependencies.

## CRON configuration

For our demo, we'll generally cache QQQ and SPY daily quotes every minute
during extended market hours 8am-6pm M-F U.S. eastern time with CRON `"0 */1 08-18 * * 1-5"`.

- [CRON syntax documentation](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-timer#cron-expressions)

To enable use of eastern time zone CRON values, we have configured our Azure Functions
to override the default UTC timezone; which is okay for our purposes.

## Time zone configuration

Azure App Service server app settings on Linux servers:

> `TZ` : `America/New_York` for Linux instance.

This is often documented for Windows instances servers as:

> `WEBSITE_TIME_ZONE` : `Eastern Standard Time`

 In Azure App Service, the time zone is configured via the WEBSITE_TIME_ZONE app setting (not in local settings).

- Windows: use Windows time-zone names (e.g. “Pacific Standard Time”).
- Linux: use IANA names (e.g. “America/Los_Angeles”).
- Note: Linux Consumption/Flex Function Apps may not support this setting.

## Related documentation

- [Main Project Setup](../../README.md#development-setup) - Complete development environment setup
- [Environment Configuration](../../README.md#environment-configuration) - Additional configuration details  
- [Azure Key Vault Setup](../../README.md#setting-up-azure-key-vault-for-storing-secrets) - Secure secret management

---
Last updated: August 15, 2025
