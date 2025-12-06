# GitHub Copilot Instructions for Stock Charts

## Project overview

This is a full-stack financial charting application with:

- **Frontend**: Angular v21 with TypeScript, Angular Material, Chart.js
- **Backend**: .NET 10 with Azure Functions and Web API
- **Package management**: pnpm workspaces for unified dependency management
- **Purpose**: Display and analyze stock market data with interactive charts

## Architecture

```text
stock-charts/
├── package.json     # Root workspace configuration
├── pnpm-workspace.yaml # pnpm workspace definition
├── Charts.sln       # .NET solution file
├── client/          # Angular frontend workspace
│   ├── src/         # Angular source code
│   └── package.json # Frontend dependencies
└── server/          # .NET backend services
    ├── Functions/   # Azure Functions for data processing
    ├── WebApi/      # REST API endpoints
    └── Directory.Packages.props  # Centralized NuGet versions
```

## Key technologies

### Frontend stack

- **Angular v21**: Modern web framework with standalone components and signals
- **TypeScript**: Primary language with strict type checking
- **Chart.js v4+**: Data visualization for financial charts
- **Angular Material v21**: UI component library
- **Signals**: Modern reactivity for state management
- **Modern Control Flow**: `@if`, `@for`, `@switch` syntax

### Backend stack

- **C# / .NET 10**: Server-side language and framework
- **Azure functions**: Serverless compute for data processing
- **ASP.NET Core**: Web API for REST endpoints
- **Entity framework**: Data access and ORM

## Development setup

### pnpm workspace commands

```bash
# Install all dependencies (run from root)
pnpm install

# Development server
pnpm start  # Starts Angular dev server

# Building
pnpm run build     # Build all workspaces
pnpm run build:prod  # Production build

# Code quality
pnpm run format    # Format all code
pnpm run lint      # Lint all workspaces
pnpm run test      # Test all workspaces

# Workspace-specific commands
pnpm --filter @stock-charts/client run build
pnpm --filter @stock-charts/client run test
```

### .NET Commands

```bash
# Build (run from root)
dotnet build Charts.sln

# Run specific project
dotnet run --project server/WebApi
dotnet run --project server/Functions
```

## Coding conventions

### Frontend (Angular) - Use MCP for Best Practices

- **Always consult**: Use #tool:angular-cli/* for latest official guidance and documentation
- **Project-specific**: Follow guidelines in #file:instructions/angular.instructions.md

### Backend (.NET)

- Use latest C# language features (.NET 9+)
- Follow Microsoft coding conventions
- Implement async/await patterns for I/O operations
- Use record types for DTOs where appropriate
- Build and test against `Charts.sln` from root directory

### Common patterns

- Use TypeScript strict mode throughout
- Implement proper type safety with Angular signals
- Use descriptive variable and method names
- Keep functions small and focused
- Write unit tests for business logic

## Development workflow

1. **Setup**:
   - Run `pnpm install` from root to install all dependencies
   - Use VS Code with recommended extensions

2. **Frontend development**:
   - Use `pnpm start` from root for Angular dev server
   - Use workspace-aware commands for linting/formatting
   - Consult MCP Angular CLI server for best practices

3. **Backend development**:
   - Build with `dotnet build Charts.sln` from root
   - Use centralized package management in `Directory.Packages.props`

## Package management

### pnpm workspaces

- **Root workspace**: Shared tools (Prettier, markdownlint)
- **Client workspace**: Angular-specific packages
- Follow guidelines in `.github/instructions/pnpm-packages.instructions.md`

### NuGet packages

- **Central management**: Use `Directory.Packages.props`
- **Solution-wide**: Build and update via `Charts.sln`
- Follow guidelines in `.github/instructions/nuget-packages.instructions.md`

## VS Code integration

- **Tasks**: Use VS Code task palette for common operations
- **Formatting**: Auto-format on save with Prettier
- **Building**: Use `Ctrl+Shift+P` → "Tasks: Run Task"
- **Debugging**: Configured launch profiles for both frontend and backend

## Context for AI assistance

When working on this codebase:

- **Always check MCP server**: Use Angular CLI MCP for latest best practices
- **Workspace structure**: Commands run from root, leverage pnpm workspaces
- **Solution structure**: Use `Charts.sln` for all .NET operations
- **Type safety**: Prioritize TypeScript strict mode and Angular signals
- **Financial accuracy**: Consider precision and performance for financial data
- **Responsive design**: Ensure charts work across device sizes
- **Performance**: Optimize for Chart.js rendering and data processing

> **IMPORTANT**: _don't be lazy_ about fixing underlying issues. Examples of being lazy:
>
> - suppressing code analysis errors, warnings, or recommendations
> - not adding unit test coverage or not checking for passing tests
> - skipping, ignoring, or reducing the test scenarios criteria or assertions
> - not resolving package dependency issues

## Code completion requirements

**Before completing any coding task**, follow the #file:instructions/code-completion.instructions.md

- ✅ Format all code: `pnpm run format`
- ✅ Lint all code with zero errors
- ✅ Build all projects successfully
- ✅ Run and pass all tests
- ✅ Update documentation as needed
- ✅ Verify full application integration

## File structure guidelines

- **Configuration files**: Keep at appropriate level (root vs workspace)
- **Dependencies**: Root for shared tools, workspace for specific needs
- **Build outputs**: Respect `.gitignore` patterns for node_modules and bin/obj
- **Documentation**: Update instructions when changing project structure

---

Last updated: December 3, 2025
