# Stock Indicators for .NET demo

This is a demo of the [Skender.Stock.Indicators](https://www.nuget.org/packages/Skender.Stock.Indicators) NuGet package. It is an Angular website with a [Chart.js](https://github.com/chartjs/chartjs-chart-financial) financial/candlestick stock chart, with a .NET Web API backend to generate indicators. The indicator library can be implemented in any .NET compatible ecosystem (it does not have to be in an API like this). See the [library documentation](https://dotnet.stockindicators.dev) for [more examples](https://dotnet.stockindicators.dev/examples), the user guide, and a full list of available indicators.

Live demo site: [charts.StockIndicators.dev](https://charts.stockindicators.dev/)

![image](https://raw.githubusercontent.com/DaveSkender/Stock.Indicators/main/docs/examples.webp)

## Author's note

This repo and charting tool is primarily intended to demonstrate the [Stock Indicators for .NET](https://dotnet.stockindicators.dev) library. **It is not meant to be a fully featured charting system** and may not be an architectural model that works for your use case. If you need a mature charting tool, please explore all of your [charting and visualization options](https://github.com/DaveSkender/Stock.Indicators/discussions/430).

## Development setup

### Prerequisites

- [Git](https://git-scm.com/) and [Node.js](https://nodejs.org/) (LTS version)
- [.NET SDK 9](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Visual Studio Code](https://code.visualstudio.com/) (recommended) or [Visual Studio](http://visualstudio.com)

### Quick start

1. **Clone the repository**

   ```bash
   git clone https://github.com/facioquo/stock-charts.git
   cd stock-charts
   ```

2. **Install global dependencies**

   ```bash
   # Azure Functions Core Tools (required for local development)
   npm install -g @angular/cli azure-functions-core-tools
   
   # Note: Azurite is installed automatically with npm install
   ```

3. **Install dependencies and start development**

   ```bash
   # Install all dependencies (run from root)
   npm install

   # Build .NET solution
   dotnet build Charts.sln
   ```

4. **Start the full development stack**

   In VS Code, use `Ctrl+Shift+P` → "Tasks: Run Task" → available tasks

   Or manually start services in order:

   ```bash
   # Terminal 1 - Storage emulator (start first)
   azurite --skipApiVersionCheck --location ./.azurite

   # Terminal 2 - Azure Functions
   cd server/Functions && func start

   # Terminal 3 - Web API
   cd server/WebApi && dotnet run

   # Terminal 4 - Angular website
   npm start
   ```

5. **Access the application**
   - Website: <http://localhost:4200>
   - Web API: <https://localhost:5001>
   - Azure Functions: <http://localhost:7071>

### Notes on local hosting

The Web API runs directly on Kestrel instead of IIS Express to simplify cross-platform development and containerization. If you need IIS Express profiles for legacy tooling, you can add a `launchSettings.json` under `server/WebApi/Properties/` but this is not required for the default workflow.

```bash
dotnet build Charts.sln
```

## Code quality and verification

The project maintains high code quality through automated linting, formatting, and testing:

**Linting and formatting:**

- ✅ ESLint passes for all TypeScript/Angular code
- ✅ Prettier formatting enforced across frontend files
- ✅ dotnet format enforced for .NET code
- ✅ Markdownlint validates documentation
- ✅ Manual formatting workflow (auto-save disabled)

**Building:**

- ✅ .NET solution builds successfully (`Charts.sln`)
- ⚠️ Angular build has dependency conflicts (functionality unaffected)
- ✅ All VS Code tasks working properly

**Testing:**

- ⚠️ Jest tests affected by npm workspace configuration
- ✅ Application functionality verified through manual testing
- ✅ API failover and error handling tested

**Quality assurance:**

For comprehensive code completion requirements, see the [Code completion checklist](.github/instructions/code-completion-checklist.instructions.md).

**Note**: There are known issues with Angular builds and Jest tests in the npm workspace configuration that don't affect core functionality. Linting, formatting, and .NET builds work perfectly.

## Project structure

This repository uses **npm workspaces** to manage dependencies and scripts across the entire project.

### Workspace organization

```text
stock-charts/              # Root workspace
├── package.json           # Root configuration with shared scripts
├── client/                # Angular frontend workspace
│   └── package.json       # Client-specific dependencies
└── server/                # .NET backend (no npm dependencies)
```

### Available scripts

**Root level commands** (run from project root):

```bash
# Development
npm start                  # Start Angular dev server
npm run dev               # Alias for npm start

# Building
npm run build             # Build all workspaces
npm run build:prod        # Production build

# Code Quality
npm run lint              # Lint all workspaces
npm run lint:fix          # Auto-fix linting issues
npm run format            # Format all code
npm run format:check      # Check formatting
npm run format:vscode     # Format VS Code configs

# Testing
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage

# Maintenance
npm run clean             # Clean all build outputs
npm run lint:md           # Lint markdown files
```

**Workspace-specific commands**:

```bash
# Target specific workspace
npm run build --workspace=@stock-charts/client
npm run test --workspace=@stock-charts/client
```

### VS Code development

This repository includes optimized VS Code configuration with tasks, problem matchers, and recommended extensions.

**Recommended extensions** (automatically suggested):

- Azure Functions
- Azure Storage
- C# Dev Kit
- ESLint
- Prettier - Code formatter
- Angular Language Service
- Azurite

**Available tasks** (`Ctrl+Shift+P` → "Tasks: Run Task"):

- `build-website` - Build Angular frontend
- `build-server` - Build .NET backend
- `start-website` - Start Angular dev server
- `start-functions` - Start Azure Functions
- `start-webapi` - Start .NET Web API
- `start-azurite` - Start Azurite storage emulator
- `lint-website` - Run ESLint on Angular code
- `lint-website-fix` - Auto-fix ESLint issues
- `test-website` - Run Angular tests

### Local storage with Azurite

The application uses [Azurite](https://docs.microsoft.com/en-us/azure/storage/common/storage-use-azurite) for local Azure Storage emulation.

**Azurite configuration:**

- **Blob service**: <http://127.0.0.1:10000>
- **Queue service**: <http://127.0.0.1:10001>
- **Table service**: <http://127.0.0.1:10002>
- **Connection string**: `UseDevelopmentStorage=true`
- **Data location**: `./.azurite/` (auto-created, ignored by git)

**Storage configuration files:**

- Functions: `server/Functions/local.settings.json`
- WebAPI: `server/WebApi/appsettings.Development.json`

#### Azurite data persistence and cleanup

Azurite stores its local data files (blob, queue, table) in the `./.azurite/` directory at the repository root. This folder is git-ignored. If you need to reset local storage to a clean state (for example, removing test blobs or queues):

```bash
rm -rf ./.azurite   # or manually delete folder in Explorer
```

Then restart the Azurite task (`start-azurite`) to recreate a fresh store.

### Environment configuration

**Angular environment** (`client/src/environments/environment.ts`):

```typescript
export const env: EnvConfig = {
  production: false,
  api: 'https://localhost:5001', // WebAPI endpoint
};
```

**Azure functions** (`server/Functions/local.settings.json`):

```json
{
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated"
  }
}
```

### Quote data configuration (Optional)

To enable quote data fetching from Alpaca API, configure these environment variables:

```bash
setx ALPACA_KEY "YOUR ALPACA API KEY"
setx ALPACA_SECRET "YOUR ALPACA SECRET KEY"
```

See [Azure Functions documentation](server/Functions/README.md) for more details on Functions-specific configuration.

## Code formatting and quality

This project uses **Prettier** and **ESLint** to maintain consistent code formatting and quality across all files.

### Prettier configuration

Prettier is configured with Angular best practices and different rules for different file types:

- **TypeScript (.ts)**: Single quotes, trailing commas, 100 character line width
- **HTML (.html)**: Double quotes, 120 character line width, CSS whitespace sensitivity
- **SCSS/CSS**: Single quotes, 100 character line width
- **JSON (.json/.jsonc)**: Double quotes, 120 character line width
- **VS Code config (.vscode/\*.json)**: Double quotes, 80 character line width for compact arrays

**Array formatting**: Short arrays like `["$tsc"]` stay on single lines, while longer arrays are formatted across multiple lines for readability.

### Formatting commands

**Manual formatting:**

```bash
# Format all code (frontend + backend) - DEFAULT
npm run format
npm run format:check

# Format specific code types
npm run format:web             # Frontend only (TypeScript, HTML, SCSS, etc.)
npm run format:web:check       # Check frontend formatting
npm run format:dotnet          # .NET only
npm run format:dotnet:check    # Check .NET formatting

# Legacy aliases (same as default)
# Format via VS Code task
Ctrl+Shift+P → "Tasks: Run Task" → "format-all" (uses npm run format)
```

**IDE integration:**

- **Format on save**: Disabled to avoid conflicts with coding agents
- **Format on demand**: Use `npm run format` or VS Code command palette
- **ESLint integration**: Prettier rules are enforced through ESLint

### Development workflow

1. **Install Prettier extension** in VS Code (recommended in workspace)
2. **Format code manually** using `npm run format` before committing
3. **ESLint errors** will show for formatting violations
4. **Run format tasks** before committing code for consistency

### Configuration files

- `.prettierrc.json` - Global Prettier configuration
- `.prettierignore` - Files to exclude from formatting
- `client/.eslintrc.json` - ESLint rules including Prettier integration
- `.vscode/settings.json` - VS Code formatter preferences
- `.editorconfig` - Cross-editor formatting rules for .NET (used by dotnet format)

## Using the dev container

This repository includes a Dev Container configuration to provide a consistent development environment. The Dev Container includes the following tools and dependencies:

- .NET SDK 9
- Node LTS
- NPM latest
- GitHub CLI
- Angular CLI
- Azure Functions Core Tools
- PowerShell
- ESLint
- Prettier

### Steps to use dev container

1. Install [Visual Studio Code](https://code.visualstudio.com/) and the [Remote - Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).

2. Clone the repository and open it in Visual Studio Code.

3. When prompted, reopen the repository in the Dev Container.

4. The Dev Container will be built and started automatically. You can now use the integrated terminal and other tools within the Dev Container.

### Environment variables

The Dev Container includes the following environment variables:

- `ALPACA_KEY`
- `ALPACA_SECRET`
- `AzureWebJobsStorage`

These environment variables are required for fetching quote data from the Alpaca API and for local development and debugging of Azure Functions.

## Setting up Azure Key Vault for storing secrets

To securely store and manage secrets such as `ALPACA_KEY` and `ALPACA_SECRET`, you can use Azure Key Vault. Follow the steps below to set up and use Azure Key Vault for storing secrets.

### Steps to use Azure Secrets

1. Create an Azure Key Vault in your Azure subscription.

2. Add the secrets to the Azure Key Vault.

3. Configure the Azure Functions to use the Azure Key Vault.

4. Update the Azure Functions code to retrieve the secrets from the Azure Key Vault.

## Type-aware ESLint (advanced)

Type-aware linting is enabled via `parserOptions.project` in `client/.eslintrc.json` using a dedicated `tsconfig.eslint.json` that includes all source files. This unlocks rules like `@typescript-eslint/prefer-nullish-coalescing` and `@typescript-eslint/no-floating-promises`.

Current settings:

- `tsconfig.eslint.json` includes `src/**/*.ts` with `noEmit`
- `strictNullChecks` is enabled in `tsconfig.json`
- `@typescript-eslint/prefer-nullish-coalescing`: ERROR (enforced consistency for nullish fallbacks)
- `@typescript-eslint/no-floating-promises`: ERROR (ensure async intent explicit)

Performance guidance:

- Type-aware linting can be 2-4x slower. Run `npm run lint --workspace=@stock-charts/client` before commit rather than on every file save.
- Consider running `npx eslint src/app/services/window.service.ts --fix` for focused fixes while iterating.

Nullish coalescing vs logical OR:

- Use `??` for fallback only when a value is `null | undefined`.
- Keep `||` for boolean logic, e.g. `if (a || b)` conditions.
- Avoid changing short-circuit boolean expressions to `??` unless their intent is value fallback, not truthiness.

Suppressing rules (rare):

```ts
// eslint-disable-next-line @typescript-eslint/no-floating-promises -- intentional fire-and-forget telemetry
void sendTelemetryAsync(event);
```

Migration notes:

- Existing `||` fallbacks were audited and updated; passing lint with zero errors.
- Future: can add `@typescript-eslint/strict-boolean-expressions` after further tightening types.

## Contributing

We welcome contributions! Please read our [Contributing Guidelines](docs/contributing.md) for details on:

- How to report bugs and submit fixes
- Development setup and workflow
- Code quality requirements
- Pull request process

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

---
Last updated: August 15, 2025
