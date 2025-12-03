---
applyTo: "package.json, client/package.json"
description: "Guidelines for managing pnpm packages in workspace structure"
---

## pnpm workspace package management

This project uses **pnpm workspaces** with a root workspace and client workspace. Follow these guidelines:

### General rules

- Always update packages to their latest compatible versions
- Do not use `^` or `~` version ranges
- Start with Angular package updates using `ng update` CLI for proper migrations
- Use `ncu --peer` CLI to determine latest compatible versions
- ALWAYS understand and resolve all `pnpm` warnings and `pnpm audit` issues

### Workspace structure

- **Root workspace**: Shared development tools (Prettier, markdownlint-cli)
- **Client workspace**: Angular-specific packages and dependencies
- **Commands run from root**: Work across all workspaces using `--filter` flag

### Update process

```bash
# Navigate to repository root
cd $(git rev-parse --show-toplevel)

# Install/update pnpm workspace dependencies
pnpm install

# Install global tools if needed
pnpm add -g @angular/cli npm-check-updates

# Check and apply Angular updates FIRST (run inside client workspace so migrations run in correct context)
cd client

# Option A: Use local Angular CLI via pnpm exec (preferred, no global dependency)
pnpm exec ng update @angular/cli @angular/core @angular/material --allow-dirty

# Option B (if Angular CLI installed globally and versions align)
# ng update @angular/cli @angular/core @angular/material --allow-dirty

cd ..  # return to repo root

# Update all npm packages using workspace-aware commands
ncu -u --peer --packageFile client/package.json  # Update client workspace
ncu -u --peer  # Update root workspace

# Install all updates
pnpm install
```

### Best practices for workspaces

#### Root Workspace (/)

- Keep only shared development tools: Prettier, markdownlint, etc.
- Avoid adding packages that should be workspace-specific
- Use for scripts that operate across entire repository

#### Client Workspace (client/)

- All Angular and frontend-related packages
- Test frameworks (Vitest, Angular testing utilities)
- Build tools specific to Angular

#### Important Version Compatibility

- **Vitest**: Use highest version compatible with Angular, may not be latest Vitest
- **Angular**: Keep all @angular/\* packages at same version for compatibility
- **Node**: Ensure all packages support same Node.js version (see engines in package.json)

### Commands reference

```bash
# Install dependencies for all workspaces
pnpm install

# Run scripts in specific workspace
pnpm --filter @stock-charts/client run build
pnpm --filter @stock-charts/client run test

# Run scripts across all workspaces
pnpm run lint  # Runs lint in all workspaces
pnpm run format  # Formats entire repository

# Check for updates
pnpm outdated --filter @stock-charts/client
pnpm audit --filter @stock-charts/client
```

### Troubleshooting

- If workspace commands fail, ensure you're in repository root
- Use `pnpm list --filter @stock-charts/client` to debug dependency trees
- Clear node_modules and reinstall if workspace structure seems corrupted:

```bash
rm -rf node_modules client/node_modules pnpm-lock.yaml
pnpm install
```

---

Last updated: December 3, 2025
