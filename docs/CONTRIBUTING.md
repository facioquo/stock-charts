# Contributing guidelines

Thanks for taking the time to contribute! We accept:

- Bug reports and fixes
- Demonstrations of other `Skender.Stock.Indicators` NuGet package features

## Reporting bugs

Submit an Issue with a clear description of the problem, steps to reproduce, code samples, and any reference materials.

## AI agents

If you're using AI coding agents (GitHub Copilot, Claude, etc.), refer to [AGENTS.md](../AGENTS.md) for comprehensive project context including directives, structure, commands, and boundaries.

## Development setup

### Prerequisites

**All platforms:**

- [Git](https://git-scm.com/) and [Node.js](https://nodejs.org/) (v24.13.1 LTS or later)
- [pnpm](https://pnpm.io/) (v10.29.3 or later) - Installed via platform package managers:
  - **macOS**: Homebrew (`brew install pnpm`)
  - **Windows**: winget (`winget install pnpm.pnpm`)
  - **Linux**: Corepack (`corepack enable && corepack prepare pnpm@10.29.3 --activate`)
- [Angular CLI](https://angular.dev/cli) - Installed globally during setup
- [.NET SDK](https://dotnet.microsoft.com/download/dotnet) (v10.0 or later)
- [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local) (v4) - **Required for backend development**
- [Visual Studio Code](https://code.visualstudio.com/) (recommended) or [Visual Studio](http://visualstudio.com)

**Note:** Azure Functions Core Tools is essential for running the backend Azure Functions locally (`func start` command). It is not installed automatically with Node or .NET SDK.

### Platform-specific installation

#### Quick setup (all platforms)

Clone the repository and run the universal setup script that automatically detects your OS:

```bash
git clone https://github.com/facioquo/stock-charts.git
cd stock-charts
bash scripts/setup-environment.sh
```

Or use VS Code: `Ctrl+Shift+P` → "Tasks: Run Task" → "Setup: Dev environment"

Manually install dependencies (alternative if not using the setup script):

```bash
pnpm install
```

#### Platform-specific scripts

**macOS** - `scripts/setup-macos.sh`

Installs all prerequisites via [Homebrew](https://brew.sh/):

- Node.js v24
- .NET SDK v10
- Azure Functions Core Tools v4
- pnpm v10.29.3 (via Homebrew)
- Angular CLI (global via pnpm)

```bash
bash scripts/setup-macos.sh
```

**Linux** - `scripts/setup-linux.sh`

Installs all prerequisites via apt-get:

- Node.js v24.13.1
- .NET SDK v10.0
- pnpm v10.29.3 (via Corepack)
- Angular CLI (global)

```bash
bash scripts/setup-linux.sh
```

**Note:** Azure Functions Core Tools must be installed manually on Linux. See the [installation guide](https://learn.microsoft.com/azure/azure-functions/functions-run-local#linux).

**Windows** - `scripts/setup-windows.sh`

Installs all prerequisites via winget (requires Git Bash for Windows):

- Node.js v24.13.1 LTS
- .NET SDK v10.0
- Azure Functions Core Tools v4
- pnpm v10.29.3 (via winget)
- Angular CLI (global via pnpm)

```bash
bash scripts/setup-windows.sh
```

**Note:** Requires [Git Bash for Windows](https://git-scm.com/downloads) and [winget (Windows Package Manager)](https://aka.ms/getwinget).

**Alternative: WSL2** (recommended for Windows developers)

Use [Windows Subsystem for Linux 2](https://learn.microsoft.com/windows/wsl/install) with the Linux setup script:

```bash
wsl --install
# After WSL setup, run the universal script
bash scripts/setup-environment.sh
```

### Verify installation

After running the setup script or manual installation, verify all tools:

```bash
node --version    # Should be v24.13.1+
pnpm --version    # Should be 10.29.3+
dotnet --version  # Should be 10.0+
func --version    # Should be 4.x
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

Last updated: February 16, 2026
