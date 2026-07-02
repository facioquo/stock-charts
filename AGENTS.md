# Stock Charts

Full-stack financial charting application showcasing the [FacioQuo.Stock.Indicators](https://www.nuget.org/packages/FacioQuo.Stock.Indicators) NuGet package. React frontend with Chart.js visualization and .NET backend with Azure Functions.

## Primary directive

Enable developers to quickly evaluate and understand the FacioQuo.Stock.Indicators library capabilities through interactive financial charting demonstrations, accelerating their decision-making about library adoption and reducing integration learning time.

## Secondary directives

1. Provide reference implementation patterns that developers can copy into their own projects to reduce implementation errors and time-to-production (not as important as evaluation acceleration)
2. Ensure seamless first-run experience for developers on all platforms through automated setup and clear documentation (not as important as #1)
3. Maintain visual quality and performance that reflects real-world production requirements so developers can trust the library's capabilities (not as important as #2)

## Repository structure

```text
stock-charts/
├── package.json              # Root workspace config
├── pnpm-workspace.yaml       # pnpm workspace definition
├── Charts.sln                # .NET solution file
├── web/                      # React + Vite frontend
│   ├── src/
│   │   ├── charting/         # Chart controllers and canvas helpers
│   │   ├── components/       # React components
│   │   ├── services/         # Data fetching and state services
│   │   └── styles/           # SCSS stylesheets
│   ├── index.html            # App shell
│   ├── vite.config.ts        # Vite config
│   ├── tsconfig.json         # TypeScript config
│   └── package.json          # Frontend dependencies
├── libs/                     # Shared TypeScript libraries
│   ├── chartjs-financial/    # Chart.js financial chart types (candlestick, OHLC, volume)
│   └── indy-charts/          # Reusable financial indicator charts library
├── server/                   # .NET backend
│   ├── Functions/            # Azure Functions
│   ├── WebApi/               # REST API endpoints
│   │   ├── Models/           # Data models
│   │   └── Services/         # Business logic
│   ├── WebApi.Tests/         # xUnit tests for the Web API
│   └── Directory.Packages.props  # Centralized NuGet versions
├── tests/
│   ├── playwright/           # End-to-end tests against web + VitePress
│   └── vitepress/            # Docs site (Cloudflare Pages) + indy-charts integration host
├── docs/                     # Documentation
├── scripts/                  # Setup and utility scripts
└── .github/
    └── workflows/            # CI/CD configs
```

## Commands

```bash
# Setup
# VS Code: Ctrl+Shift+P → "Tasks: Run Task" → "Setup: Dev environment"

# Install dependencies
pnpm install                   # Install all workspace dependencies

# Development
pnpm start                         # Start React dev server (http://localhost:4200)
pnpm run azure:start               # Start Azurite storage emulator
cd server/Functions && func start  # Start Azure Functions (http://localhost:7071)
cd server/WebApi && dotnet run     # Start Web API (https://localhost:5001)

# Building
pnpm run build                # Build all workspaces
pnpm run build:prod           # Production build with optimizations
dotnet build Charts.sln       # Build .NET solution

# Code quality
pnpm run format               # Format all code (Prettier for frontend, dotnet format for backend)
pnpm run format:check         # Check formatting without changes
pnpm run lint                 # Lint all workspaces (ESLint, Roslynator, markdownlint)
pnpm run lint:fix             # Auto-fix linting issues

# Testing
pnpm run test                 # Run all tests (frontend + backend)
pnpm run test:all             # Explicit all tests command
pnpm --filter @stock-charts/web run test           # Frontend tests only
pnpm run test:dotnet          # Backend tests only
dotnet test Charts.sln        # .NET tests directly

# Workspace-specific
pnpm --filter @stock-charts/web run <command>      # Run command in web workspace
```

## Code style

### Frontend (TypeScript/React)

**Good example:**

```typescript
// ✅ Hooks-based state, strict types, explicit error handling
import { useState, useEffect } from "react";

interface ChartProps {
  symbol: string;
}

export function ChartComponent({ symbol }: ChartProps) {
  const [data, setData] = useState<OhlcData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    setIsLoading(true);
    api
      .getQuotes(symbol)
      .then(response => {
        if (!cancelled) setData(response);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  return <canvas id="chartOverlay" />;
}
```

**Bad example:**

```typescript
// ❌ No types, vague names, no cleanup, no error handling
export function Chart({ s }) {
  const [data, setData] = useState();

  useEffect(() => {
    api.get("/data/" + s).then(r => setData(r));
  }, []);
}
```

### Backend (C#/.NET)

**Good example:**

```csharp
// ✅ Record types for DTOs, async/await, explicit error handling
public record ChartDataRequest(string Symbol, DateTime StartDate, DateTime EndDate);

public class ChartService
{
    private readonly IQuoteService _quoteService;

    public async Task<IEnumerable<OhlcData>> GetChartDataAsync(
        ChartDataRequest request,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.Symbol))
            throw new ArgumentException("Symbol is required", nameof(request));

        var quotes = await _quoteService.GetQuotesAsync(
            request.Symbol,
            request.StartDate,
            request.EndDate,
            ct);

        return quotes.Select(q => new OhlcData(q.Timestamp, q.Open, q.High, q.Low, q.Close));
    }
}
```

**Bad example:**

```csharp
// ❌ No DTOs, poor naming, no cancellation support, no validation
public class Service
{
    public async Task<object> Get(string s, DateTime d1, DateTime d2)
    {
        var data = await _svc.GetData(s, d1, d2);
        return data.Select(x => new { x.Timestamp, x.Open, x.High, x.Low, x.Close });
    }
}
```

## Technology conventions

- **React v19**: hooks-based state, functional components, strict mode
- **Vite v7**: dev server and production bundler for the React frontend
- **pnpm packages**: pnpm workspace dependency management
- **NuGet**: centralized NuGet package management
- **Markdown**: sentence case, AGENTS.md as canonical source

## Project structure

### Frontend architecture

- **React v19 + Vite v7**: Functional components, hooks-based state, HMR dev server
- **TypeScript**: Strict mode enabled, comprehensive type safety
- **Chart.js v4+**: Financial chart types in `libs/chartjs-financial/`; bundled into `@facioquo/indy-charts` dist
- **React Router v7**: Client-side routing
- **pnpm workspaces**: Unified dependency management across root and all workspace packages

Client-side project dependencies are strictly in this direction only: web → indy-charts → chartjs-financial

### Backend architecture

- **C# / .NET 10**: Latest language features, record types for DTOs
- **Azure Functions**: Isolated worker model for data processing
- **ASP.NET Core Web API**: REST endpoints for chart data
- **FacioQuo.Stock.Indicators**: NuGet library used in `server/WebApi/Services/` to compute every indicator the API serves
- **Directory.Packages.props**: Centralized NuGet version management
- **Caching**: Layered, built-in (no extra packages), so doc-site traffic doesn't redundantly recompute indicators. Server-side output cache (`AddOutputCache`/`UseOutputCache`) caches each computed indicator response keyed by path + query string and varied by `Origin`; an in-memory quote cache (`IMemoryCache` in `QuoteService`) downloads the shared quote blob at most once per symbol per window; and `Cache-Control: public, max-age=...` headers let browsers/CDN serve repeats. Lifetime is one knob, `Caching:DurationMinutes`, in `CacheSettings`.

### Financial charts integration

Financial chart types (`candlestick`, `ohlc`, `volume`) are maintained in `libs/chartjs-financial/` and bundled into `@facioquo/indy-charts`:

- **Location**: `libs/chartjs-financial/`
- **Registration**: `setupIndyCharts()` is called once from `web/src/main.tsx` (or `setupIndyChartsForVue()` from the Vue/VitePress adapter). `registerFinancialCharts()` is a public export of `@facioquo/chartjs-chart-financial` but indy-charts callers do not invoke it directly — `setupIndyCharts` handles registration internally.
- **Data shape**: OHLC points as `{ x: timestamp, o, h, l, c }`
- **Theming**: `getFinancialPalette()` and `applyFinancialElementTheme()`
- **Factories**: `buildCandlestickDataset()`, `buildVolumeDataset()`, `buildFinancialChartOptions()`
- **Performance**: For 5k-10k candles, disable animations, use non-intersecting tooltip mode
- **Attribution**: Derived from [chartjs/chartjs-chart-financial](https://github.com/chartjs/chartjs-chart-financial)

## Boundaries

### ✅ Always do

- Run full code completion checklist before marking work complete
- Format all code: `pnpm run format` (zero warnings required)
- Lint with zero errors: `pnpm run lint` (fix before commit)
- Build successfully: `pnpm run build` and `dotnet build Charts.sln`
- Run and pass all tests: `pnpm run test:all`
- Use TypeScript strict mode and React hooks for reactive state
- Implement async/await patterns for I/O operations
- Write unit tests for business logic
- Update documentation when changing project structure
- Use descriptive variable and method names
- Keep functions small and focused
- Handle errors explicitly with try/catch or Result types
- Validate inputs before processing
- Use centralized package management (pnpm workspaces, Directory.Packages.props)

### ⚠️ Ask first

- Adding new npm or NuGet dependencies
- Modifying workspace configuration (package.json, vite.config.ts, Charts.sln)
- Changing CI/CD workflows (.github/workflows/)
- Modifying build configurations (tsconfig.json, .csproj files)
- Database schema changes or migrations
- Changing environment configurations
- Adding new Azure Functions or API endpoints
- Modifying Chart.js extension implementations
- Changes to setup scripts that affect cross-platform compatibility

### 🚫 Never do

- Suppress TypeScript or ESLint errors without addressing root cause
- Use `@ts-ignore`, `any` types, or disable strict mode
- Skip or ignore failing tests
- Commit without running format and lint checks
- Suppress Roslynator or .NET analyzer warnings without justification
- Remove error handling to "simplify" code
- Commit secrets, API keys, or credentials
- Delete test coverage or reduce test scenarios
- Skip code completion checklist steps
- Mix frontend and backend code in same directory
- Use CommonJS `require()` in frontend (use ES6 imports)
- Hardcode environment-specific values (use environment configs)

## Development workflow

One-time setup:

1. **Setup**: VS Code task "Setup: Dev environment"
2. **Install**: Run `pnpm install` from root
3. **Credentials** (optional): Configure Alpaca API credentials for real-time quote updates
   - Copy `server/Functions/local.settings.example.json` to `local.settings.json` and fill in `ALPACA_KEY` and `ALPACA_SECRET`
   - See [server/Functions/README.md](server/Functions/README.md) for details
   - Application works fully without credentials using backup quote data
   - No exceptions thrown when credentials are missing

Typical lifecycle:

1. **Develop**: Start all services (Azurite, Functions, WebApi, React dev server)
2. **Iterate**: Make changes, run tests, check linting
3. **Complete**: Execute full code completion checklist before commit
4. **Commit**: Ensure all quality gates pass (format, lint, build, test)

## VS Code integration

- **Tasks**: `Ctrl+Shift+P` → "Tasks: Run Task" for common operations
- **Formatting**: Auto-format on save (Prettier for frontend, dotnet format for backend)
- **Extensions**: ESLint, Prettier, C# Dev Kit, Azure Storage (for viewing data), Azure Functions (for debugging)
- **Extension conflicts**: Do NOT install Azurite extension (azurite.azurite) - it conflicts with npm-based emulator (`pnpm run azure:start`). Use Azure Storage extension to view blob/queue/table data.
- **Debugging**: Press F5 to attach debugger to running Azure Functions (start Functions task first). Configured launch profiles for frontend and backend.
- **Problem panel**: Navigate errors and warnings efficiently

## Context for AI assistance

When working on this codebase:

- **Purpose**: This is a demonstration/showcase project for FacioQuo.Stock.Indicators library
- **Workspace commands**: Run from root, use `pnpm --filter` for workspace-specific operations
- **Solution structure**: Use `Charts.sln` for all .NET operations
- **Type safety**: Prioritize TypeScript strict mode, React hooks, C# nullable reference types
- **Financial accuracy**: Consider precision and performance for financial calculations
- **Responsive design**: Ensure charts render correctly across device sizes
- **Performance**: Optimize Chart.js rendering (disable animations for large datasets)
- **Quality**: Zero tolerance for suppressed errors, skipped tests, or incomplete implementations

## Pull request conventions

PR titles follow Conventional Commits format: `type: Subject` (no scope)

- `type` is lowercase: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`, `plan`
- `Subject` starts with an uppercase letter; keep total title length ≤ 65 characters
- Ignore for PRs labeled `bot`, `dependencies`, or `automated`
