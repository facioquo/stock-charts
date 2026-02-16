# Azure Functions - Stock Charts

This Azure Functions project handles scheduled data fetching and processing for the Stock Charts application.

> **Note**: For general development setup, see the [main project README](../../README.md#development-setup).

## Local development environment variables

### Configuration hierarchy

For local development, Azure Functions reads configuration from:

1. **local.settings.json** - Local development settings (gitignored, placeholder values provided in `local.settings.example.json`)
2. **Environment variables** - System or shell environment
3. **User Secrets** - .NET User Secrets (secure local development)
4. **Azure Key Vault** - Production secret management (when KEY_VAULT_URL configured)

### Alpaca API credentials (optional)

The Functions project fetches real-time stock quotes from the [Alpaca Markets API](https://alpaca.markets/). **These credentials are optional for local development** - the application will gracefully fall back to backup quote data when credentials are not configured.

#### Option 1: Local settings file (quick start)

Copy `local.settings.example.json` to `local.settings.json` and add your credentials:

```json
{
  "Values": {
    "ALPACA_KEY": "your-alpaca-api-key-here",
    "ALPACA_SECRET": "your-alpaca-secret-here"
  }
}
```

#### Option 2: Environment variables

```bash
# macOS/Linux
export ALPACA_KEY="your-alpaca-api-key-here"
export ALPACA_SECRET="your-alpaca-secret-here"

# Windows (PowerShell)
$env:ALPACA_KEY="your-alpaca-api-key-here"
$env:ALPACA_SECRET="your-alpaca-secret-here"
```

#### Option 3: .NET User Secrets (recommended for local dev)

```bash
cd server/Functions
dotnet user-secrets set "ALPACA_KEY" "your-alpaca-api-key-here"
dotnet user-secrets set "ALPACA_SECRET" "your-alpaca-secret-here"
```

#### Get free API credentials

1. Sign up at [alpaca.markets](https://alpaca.markets/)
2. Navigate to Paper Trading API keys
3. Generate new API key and secret

#### Behavior without credentials

- Functions start successfully with warning log
- Quote updates are skipped
- WebAPI automatically serves backup quote data
- Full application functionality available for demo purposes

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
