---
applyTo: "**/*.{csproj,sln},**/Directory.Packages.props"
description: "Guidelines for managing NuGet packages"
---

## NuGet package management

This project uses a root solution file (`Charts.sln`) with centralized package management.

### General rules

- Always update packages to their latest compatible versions
- NEVER use preview or rollback from current version levels for primary packages
- Use `dotnet-outdated` CLI to determine latest versions
- Sort package references alphabetically in `.csproj` and `.props` files
- ALWAYS verify updates with `dotnet build Charts.sln` and resolve all errors

### Project structure

- **Root solution**: `Charts.sln` (contains WebApi and Functions projects)
- **Centralized packages**: `server/Directory.Packages.props` for version management
- **Individual projects**: `server/WebApi/WebApi.csproj`, `server/Functions/Functions.csproj`

### Update process

```bash
# Navigate to repository root
cd $(git rev-parse --show-toplevel)

# Install dotnet-outdated tool if needed
dotnet tool install -g dotnet-outdated-tool

# Check for outdated packages across solution
dotnet outdated Charts.sln

# Update packages (run from root directory)
dotnet outdated Charts.sln --upgrade

# Alternative: Update specific projects
dotnet outdated server/WebApi/WebApi.csproj --upgrade
dotnet outdated server/Functions/Functions.csproj --upgrade

# Build and verify
dotnet build Charts.sln --configuration Release

# Test to ensure nothing breaks
dotnet test Charts.sln
```

### Best practices

#### Central Package Management

- Use `Directory.Packages.props` for version consistency across projects
- Define common package versions in one place
- Avoid version conflicts between WebApi and Functions projects

#### Package Categories

- **Microsoft.AspNetCore.\***: For WebApi project
- **Microsoft.Azure.Functions.\***: For Functions project
- **Shared dependencies**: Common logging, configuration, etc.

#### Build Verification

```bash
# Always build from root with solution file
dotnet build Charts.sln --configuration Release --no-restore

# Check for warnings
dotnet build Charts.sln --verbosity normal | grep -i warn

# Clean build when needed
dotnet clean Charts.sln
dotnet build Charts.sln --configuration Release
```

### Troubleshooting

- If package conflicts arise, check `Directory.Packages.props`
- Use `dotnet list package` to view installed packages
- For version conflicts: `dotnet list package --include-transitive`
- Clear caches if needed: `dotnet nuget locals all --clear`

---

Last updated: August 15, 2025
