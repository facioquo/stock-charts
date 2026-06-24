# Azure Functions - Stock Charts

This Azure Functions project handles scheduled data fetching and processing for the Stock Charts application.

> **Note**: For general development setup, see the [main project README](../../README.md#development-setup).

## Local development environment variables

### Configuration hierarchy

For local development, Azure Functions reads configuration from:

1. **`local.settings.json`** - Functions-specific settings (gitignored, template at `local.settings.example.json`)
2. **Environment variables** - System or shell environment
3. **Azure Key Vault** - Production secret management (when `KEY_VAULT_URL` configured)

### Alpaca API credentials (optional)

The Functions project fetches real-time stock quotes from the [Alpaca Markets API](https://alpaca.markets/). **These credentials are optional** — the application falls back to backup quote data when they are absent.

#### Setup: `local.settings.json`

Copy `local.settings.example.json` to `local.settings.json` and fill in your credentials:

```bash
cp server/Functions/local.settings.example.json server/Functions/local.settings.json
```

Then edit `server/Functions/local.settings.json` and set `ALPACA_KEY` and `ALPACA_SECRET`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated",
    "KEY_VAULT_URL": "",
    "FUNCTIONS_RUN_ON_STARTUP_ENABLED": "true",
    "ALPACA_KEY": "your-alpaca-api-key-here",
    "ALPACA_SECRET": "your-alpaca-secret-here"
  }
}
```

The `start-functions.js` script creates `local.settings.json` automatically from the example file if it doesn't exist, so you can also just copy and edit it manually.

#### Dev container setup

For dev containers, `devcontainer.json` uses `containerEnv` to inject credentials from the host shell at container creation time. Export the variables in your host shell before opening the container:

```bash
export ALPACA_KEY=your-alpaca-api-key-here
export ALPACA_SECRET=your-alpaca-secret-here
code .  # then "Reopen in Container"
```

#### Get free API credentials

1. Sign up at [alpaca.markets](https://alpaca.markets/)
2. Navigate to Paper Trading API keys
3. Generate new API key and secret

#### Behavior without credentials

- Functions start successfully with a warning log
- Bar updates are skipped
- WebAPI automatically serves backup quote data
- Full application functionality is available for demo purposes

**Azure storage**: The project uses Azurite for local development, installed via npm (`azurite` package). Start with `pnpm run azure:start` or VS Code task "Run: Azure Storage".

⚠️ **Important**: Do NOT install the Azurite VS Code extension (`azurite.azurite`). It conflicts with the npm-based emulator by trying to use the same port (10000). Use the Azure Storage extension (`ms-azuretools.vscode-azurestorage`) to view storage data.

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
