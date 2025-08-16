---
applyTo: "package.json, client/package.json"
description: "Guidelines for managing NPM packages in workspace structure"
---

## NPM workspace package management

This project uses **npm workspaces** with a root workspace and client workspace. Follow these guidelines:

### General rules

- Always update packages to their latest compatible versions
- Do not use `^` or `~` version ranges
- Start with Angular package updates using `ng update` CLI for proper migrations
- Use `ncu --peer` CLI to determine latest compatible versions
- ALWAYS understand and resolve all `npm warn` messages and `npm audit` issues

### Workspace structure

- **Root workspace**: Shared development tools (Prettier, markdownlint-cli)
- **Client workspace**: Angular-specific packages and dependencies
- **Commands run from root**: Work across all workspaces using `--workspace` flag

### Update process

```bash
# Navigate to repository root
cd $(git rev-parse --show-toplevel)

# Install/update npm workspace dependencies
npm install

# Install global tools if needed
npm i -g @angular/cli npm-check-updates

# Check and apply Angular updates FIRST (run inside client workspace so migrations run in correct context)
cd client

# Option A: Use local Angular CLI via npx (preferred, no global dependency)
npx ng update @angular/cli @angular/core @angular/material --allow-dirty

# Option B (if Angular CLI installed globally and versions align)
# ng update @angular/cli @angular/core @angular/material --allow-dirty

cd ..  # return to repo root

# Update all npm packages using workspace-aware commands
ncu -u --peer --workspace=@stock-charts/client  # Update client workspace
ncu -u --peer  # Update root workspace

# Install all updates
npm install
```

### Best practices for workspaces

#### Root Workspace (/)

- Keep only shared development tools: Prettier, markdownlint, etc.
- Avoid adding packages that should be workspace-specific
- Use for scripts that operate across entire repository

#### Client Workspace (client/)

- All Angular and frontend-related packages
- Test frameworks (Jest, Angular testing utilities)
- Build tools specific to Angular

#### Important Version Compatibility

- **Jest**: Use highest version compatible with Angular, may not be latest Jest
- **Angular**: Keep all @angular/\* packages at same version for compatibility
- **Node**: Ensure all packages support same Node.js version (see engines in package.json)

### Commands reference

```bash
# Install dependencies for all workspaces
npm install

# Run scripts in specific workspace
npm run build --workspace=@stock-charts/client
npm run test --workspace=@stock-charts/client

# Run scripts across all workspaces
npm run lint  # Runs lint in all workspaces
npm run format  # Formats entire repository

# Check for updates
npm outdated --workspace=@stock-charts/client
npm audit --workspace=@stock-charts/client
```

### Troubleshooting

- If workspace commands fail, ensure you're in repository root
- Use `npm ls --workspace=@stock-charts/client` to debug dependency trees
- Clear node_modules and reinstall if workspace structure seems corrupted:
  ```bash
  rm -rf node_modules client/node_modules package-lock.json
  npm install
  ```

---

Last updated: August 15, 2025
