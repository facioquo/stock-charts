# Stock Indicators for .NET demo

This is a demo of the [Skender.Stock.Indicators](https://www.nuget.org/packages/Skender.Stock.Indicators) NuGet package.  It is an Angular website with a [Chart.js](https://github.com/chartjs/chartjs-chart-financial) financial/candlestick stock chart, with a .NET Web API backend to generate indicators.  The indicator library can be implemented in any .NET compatible ecosystem (it does not have to be in an API like this).  See the [library documentation](https://dotnet.stockindicators.dev) for [more examples](https://dotnet.stockindicators.dev/examples), the user guide, and a full list of available indicators.

Live demo site: [charts.StockIndicators.dev](https://charts.stockindicators.dev/)

![image](https://raw.githubusercontent.com/DaveSkender/Stock.Indicators/main/docs/examples.webp)

## Author's note

This repo and charting tool is primarily intended to demonstrate the [Stock Indicators for .NET](https://dotnet.stockindicators.dev) library.  **It is not meant to be a fully featured charting system** and may not be an architectural model that works for your use case.  If you need a mature charting tool, please explore all of your [charting and visualization options](https://github.com/DaveSkender/Stock.Indicators/discussions/430).

## Development Setup

### Prerequisites

- [Git](https://git-scm.com/) and [Node.js](https://nodejs.org/) (LTS version)
- [.NET SDK 9](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Visual Studio Code](https://code.visualstudio.com/) (recommended) or [Visual Studio](http://visualstudio.com)

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/facioquo/stock-charts.git
   cd stock-charts
   ```

2. **Install global dependencies**

   ```bash
   npm install -g @angular/cli azure-functions-core-tools azurite
   ```

3. **Start the full development stack**

   In VS Code, use `Ctrl+Shift+P` → "Tasks: Run Task" → `start-full-stack`

   Or manually start services in order:

   ```bash
   # Terminal 1 - Storage emulator (start first)
   azurite --skipApiVersionCheck --location ./.azurite
   
   # Terminal 2 - Azure Functions  
   cd server/Functions && func start
   
   # Terminal 3 - Web API
   cd server/WebApi && dotnet run
   
   # Terminal 4 - Angular website
   cd client && npm install && npm start
   ```

4. **Access the application**
   - Website: <http://localhost:4200>
   - Web API: <https://localhost:5001>
   - Azure Functions: <http://localhost:7071>

### VS Code Development

This repository includes optimized VS Code configuration with tasks, problem matchers, and recommended extensions.

**Recommended Extensions** (automatically suggested):

- Azure Functions
- Azure Storage
- C# Dev Kit
- ESLint
- Angular Language Service
- Azurite

**Available Tasks** (`Ctrl+Shift+P` → "Tasks: Run Task"):

- `start-full-stack` - Start all services (Azurite + Functions + WebAPI + Website)
- `build-all` - Build both client and server projects
- `lint-all` - Run all linting (ESLint + markdownlint)
- `test-all` - Run all tests

### Local Storage with Azurite

The application uses [Azurite](https://docs.microsoft.com/en-us/azure/storage/common/storage-use-azurite) for local Azure Storage emulation.

**Azurite Configuration:**

- **Blob Service**: <http://127.0.0.1:10000>
- **Queue Service**: <http://127.0.0.1:10001>
- **Table Service**: <http://127.0.0.1:10002>
- **Connection String**: `UseDevelopmentStorage=true`
- **Data Location**: `./.azurite/` (auto-created, ignored by git)

**Storage Configuration Files:**

- Functions: `server/Functions/local.settings.json`
- WebAPI: `server/WebApi/appsettings.Development.json`

### Environment Configuration

**Angular Environment** (`client/src/environments/environment.ts`):

```typescript
export const env: EnvConfig = {
  production: false,
  api: "https://localhost:5001"  // WebAPI endpoint
};
```

**Azure Functions** (`server/Functions/local.settings.json`):

```json
{
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated"
  }
}
```

### Quote Data Configuration (Optional)

To enable quote data fetching from Alpaca API, configure these environment variables:

```bash
setx ALPACA_KEY "YOUR ALPACA API KEY"
setx ALPACA_SECRET "YOUR ALPACA SECRET KEY"
```

## Using the Dev Container

This repository includes a Dev Container configuration to provide a consistent development environment. The Dev Container includes the following tools and dependencies:

- .NET SDK 9
- Node LTS
- NPM latest
- GitHub CLI
- Angular CLI
- Azure Functions Core Tools
- PowerShell
- ESLint

### Steps to use Dev Container

1. Install [Visual Studio Code](https://code.visualstudio.com/) and the [Remote - Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).

2. Clone the repository and open it in Visual Studio Code.

3. When prompted, reopen the repository in the Dev Container.

4. The Dev Container will be built and started automatically. You can now use the integrated terminal and other tools within the Dev Container.

### Environment Variables

The Dev Container includes the following environment variables:

- `ALPACA_KEY`
- `ALPACA_SECRET`
- `AzureWebJobsStorage`

These environment variables are required for fetching quote data from the Alpaca API and for local development and debugging of Azure Functions.

## Setting Up Azure Key Vault for Storing Secrets

To securely store and manage secrets such as `ALPACA_KEY` and `ALPACA_SECRET`, you can use Azure Key Vault. Follow the steps below to set up and use Azure Key Vault for storing secrets.

### Steps to use Azure Secrets

1. Create an Azure Key Vault in your Azure subscription.

2. Add the secrets to the Azure Key Vault.

3. Configure the Azure Functions to use the Azure Key Vault.

4. Update the Azure Functions code to retrieve the secrets from the Azure Key Vault.

## Contributing

Please read [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.
