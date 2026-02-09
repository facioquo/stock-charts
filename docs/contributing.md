# Contributing guidelines

Thanks for taking the time to contribute! We accept:

- Bug reports and fixes
- Demonstrations of other `Skender.Stock.Indicators` NuGet package features

## Reporting bugs

Submit an Issue with a clear description of the problem, steps to reproduce, code samples, and any reference materials.

## Development setup

### Prerequisites

- [Git](https://git-scm.com/) and [Node.js](https://nodejs.org/) (v24.13.0 LTS or later)
- [pnpm](https://pnpm.io/) (v10.29.2 or later) - Install with `npm install -g pnpm@10.29.2`
- [.NET SDK](https://dotnet.microsoft.com/download/dotnet) (v10.0 or later)
- [Visual Studio Code](https://code.visualstudio.com/) (recommended) or [Visual Studio](http://visualstudio.com)

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
# Ctrl+Shift+P → "Tasks: Run Task" → "start-full-stack"
```

This starts all services: Azurite storage emulator, Azure Functions, Web API, and Angular dev server.

### Start manually

Open 4 terminals and run in order:

```bash
# Terminal 1: Storage emulator
pnpm run azure:start

# Terminal 2: Azure Functions
cd server/Functions && func start

# Terminal 3: Web API
cd server/WebApi && dotnet run

# Terminal 4: Angular dev server
pnpm start
```

Access at: Website <http://localhost:4200>, Web API <https://localhost:5001>, Functions <http://localhost:7071>

### Project structure

The repository uses **pnpm workspaces**:

```text
stock-charts/          # Root
├── package.json       # Workspace config + shared scripts
├── pnpm-workspace.yaml # pnpm workspace definition
├── client/            # Angular frontend
└── server/            # .NET backend
```

Available pnpm scripts are in `package.json`. Key scripts:

- `pnpm run build` / `pnpm run build:prod` — Build workspaces
- `pnpm run lint` / `pnpm run lint:fix` — Lint and fix
- `pnpm run format` — Format all code
- `pnpm run test:all` — Run all tests

Workspace-specific: `pnpm --filter @stock-charts/client run build`

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

Contact us through the NuGet [Contact Owners](https://www.nuget.org/packages/Skender.Stock.Indicators) method, privately direct message [@daveskender](https://twitter.com/messages/compose?recipient_id=27475431) on Twitter, or [submit an Issue](https://github.com/facioquo/stock-charts/issues) with your question if it is publicly relevant.

Thanks,
Dave Skender

---

Last updated: December 3, 2025
