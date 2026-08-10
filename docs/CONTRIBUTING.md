# Contributing guidelines

Thanks for taking the time to contribute! We accept:

- Bug reports and fixes
- Demonstrations of other `FacioQuo.Stock.Indicators` NuGet package features

## Reporting bugs

Submit an Issue with a clear description of the problem, steps to reproduce, code samples, and any reference materials.

## AI agents

If you're using AI coding agents (GitHub Copilot, Claude, etc.), refer to [AGENTS.md](../AGENTS.md) for comprehensive project context including directives, structure, commands, and boundaries.

## Development setup

### Prerequisites

**All platforms:**

- [Git](https://git-scm.com/) and [Node.js](https://nodejs.org/) (v24 LTS or later)
- [pnpm](https://pnpm.io/) (v11 or later) - Installed via platform package managers:
  - **macOS**: Homebrew (`brew install pnpm`)
  - **Windows**: winget (`winget install pnpm.pnpm`)
  - **Linux**: Corepack (`corepack enable && corepack prepare pnpm --activate`)
- [.NET SDK](https://dotnet.microsoft.com/download/dotnet) (v10.0 or later)
- [Visual Studio Code](https://code.visualstudio.com/) (recommended) or [Visual Studio](http://visualstudio.com)
- [Docker](https://docs.docker.com/get-started/get-docker/) - _optional_, only to run the API in its deployment container via `pnpm run edge:dev`

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/facioquo/stock-charts.git
cd stock-charts
pnpm install
```

Or use VS Code: `Ctrl+Shift+P` → "Tasks: Run Task" → "Setup: Dev environment"

### Verify installation

After installation, verify all tools:

```bash
node --version    # Should be v24+
pnpm --version    # Should be 11+
dotnet --version  # Should be 10.0+
```

### Quick setup

```bash
# Clone and install
git clone https://github.com/facioquo/stock-charts.git
cd stock-charts
pnpm install
```

### Start development environment

**Option 1: VS Code Tasks** (recommended)

```bash
# Ctrl+Shift+P → "Tasks: Run Task" → "Run: Full development stack"
```

This starts the Web API and the React dev server.

### Start manually

Open 2 terminals and run in order:

```bash
# Terminal 1: Web API
cd server/WebApi && dotnet run

# Terminal 2: React dev server (Vite)
pnpm start
```

Access at: Website <http://localhost:4200>, Web API <https://localhost:5001>

No storage emulator or cloud credentials are required. Without a reachable quote host the API
falls back to a bundled backup dataset, so a fresh clone renders charts immediately.

### Running the API as deployed

In production the API runs as a container behind a Cloudflare Worker that owns caching and CORS.
To reproduce that locally (requires Docker):

```bash
pnpm run edge:dev   # Worker + API container on http://localhost:8787
```

See [server/edge/README.md](../server/edge/README.md) for the full local workflow, the R2 dataset
contract, and deployment steps.

### Project structure

The repository uses **pnpm workspaces**:

```text
stock-charts/          # Root
├── package.json       # Workspace config + shared scripts
├── pnpm-workspace.yaml # pnpm workspace definition
├── web/               # React + Vite frontend
└── server/            # Backend
    ├── WebApi/        # .NET indicator API (runs as a container)
    └── edge/          # Cloudflare Worker: caching/CORS front door + quote refresh cron
```

Available pnpm scripts are in `package.json`. Key scripts:

- `pnpm run build` / `pnpm run build:prod` — Build workspaces
- `pnpm run lint` / `pnpm run lint:fix` — Lint and fix
- `pnpm run format` — Format all code
- `pnpm run test:all` — Run all tests

Workspace-specific: `pnpm --filter @stock-charts/web run build`

## Development workflow

1. **Make your changes**
2. **Run checks** (before committing):
   - Lint: `pnpm run lint:fix`
   - Format: `pnpm run format`
   - Test: `pnpm run test:all`
   - Build: `dotnet build Charts.sln`

## Code quality requirements

All contributions must pass these checks (required before PR acceptance):

- ✅ **Linting:** `pnpm run lint` (zero errors)
- ✅ **Formatting:** `pnpm run format` (code properly formatted)
- ✅ **Build:** `dotnet build Charts.sln` (no errors)
- ✅ **Tests:** `pnpm run test:all` (all pass)
- ✅ **No linting suppressions** without team review

## Guidelines for contributions

- Read first: [Contributing to open-source GitHub projects](https://codeburst.io/a-step-by-step-guide-to-making-your-first-github-contribution-5302260a2940)
- **Keep changes small and focused.** Do not comingle multiple contributions in one PR.
- **Build must pass.** As a demo project, all PRs must build and run without errors.
- **Failed builds block acceptance.** Ensure all checks pass locally before opening a PR.

## Submitting changes

Submit a Pull Request with a clear description of what you've done. See [pull requests guide](http://help.github.com/pull-requests/) for details.

After merge to `main`, changes may be batched before deploying. Turnaround time varies.

## Contact us

Contact us through the NuGet [Contact Owners](https://www.nuget.org/packages/FacioQuo.Stock.Indicators) method, privately direct message [@daveskender](https://twitter.com/messages/compose?recipient_id=27475431) on Twitter, or [submit an Issue](https://github.com/facioquo/stock-charts/issues) with your question if it is publicly relevant.

Thanks,
Dave Skender
