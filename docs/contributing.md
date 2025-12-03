# Contributing guidelines

Thanks for taking the time to contribute! We accept:

- Bug reports and fixes
- Demonstrations of other `Skender.Stock.Indicators` NuGet package features

## Reporting bugs

Submit an Issue with a clear description of the problem, steps to reproduce, code samples, and any reference materials.

## Development setup

### Prerequisites

- [Git](https://git-scm.com/) and [Node.js](https://nodejs.org/)
- [.NET SDK](https://dotnet.microsoft.com/download/dotnet)
- [Visual Studio Code](https://code.visualstudio.com/) (recommended) or [Visual Studio](http://visualstudio.com)

### Quick setup

```bash
# Clone and install
git clone https://github.com/facioquo/stock-charts.git
cd stock-charts
npm install
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
npm run azure:start

# Terminal 2: Azure Functions
cd server/Functions && func start

# Terminal 3: Web API
cd server/WebApi && dotnet run

# Terminal 4: Angular dev server
npm start
```

Access at: Website <http://localhost:4200>, Web API <https://localhost:5001>, Functions <http://localhost:7071>

### Project structure

The repository uses **npm workspaces**:

```text
stock-charts/          # Root
├── package.json       # Workspace config + shared scripts
├── client/            # Angular frontend
└── server/            # .NET backend
```

Available npm scripts are in `package.json`. Key scripts:

- `npm run build` / `npm run build:prod` — Build workspaces
- `npm run lint` / `npm run lint:fix` — Lint and fix
- `npm run format` — Format all code
- `npm run test:all` — Run all tests

Workspace-specific: `npm run build --workspace=@stock-charts/client`

## Development workflow

1. **Make your changes**
2. **Run checks** (before committing):
   - Lint: `npm run lint:fix`
   - Format: `npm run format`
   - Test: `npm run test:all`
   - Build: `dotnet build Charts.sln`

## Code quality requirements

All contributions must pass these checks (required before PR acceptance):

- ✅ **Linting:** `npm run lint` (zero errors)
- ✅ **Formatting:** `npm run format` (code properly formatted)
- ✅ **Build:** `dotnet build Charts.sln` (no errors)
- ✅ **Tests:** `npm run test:all` (all pass)
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

Last updated: August 15, 2025
