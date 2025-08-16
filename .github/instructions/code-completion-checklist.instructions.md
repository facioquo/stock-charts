---
applyTo: "**/*"
description: "Comprehensive checklist for code completion and quality assurance"
---

# Code completion checklist

This checklist ensures all code changes meet quality standards before being committed or submitted. **All items must be completed without unresolved errors, warnings, or CLI recommendations.**

## Required completion steps

### 1. Code formatting and style

**All code formatting (recommended):**

```bash
# Format and check all code (frontend + backend)
npm run format
npm run format:check  # Must pass with no issues
```

**Individual formatting:**

```bash
# Frontend only (TypeScript, HTML, SCSS files)
npm run format:web
npm run format:web:check

# Backend only (C# files)
npm run format:dotnet
npm run format:dotnet:check
```

### 2. Code linting and analysis

**Frontend linting:**

```bash
# Lint TypeScript/Angular code
npm run lint --workspace=@stock-charts/client -- --max-warnings=0  # Fail if any warnings remain

# Auto-fix linting issues where possible
npm run lint:fix --workspace=@stock-charts/client

# Re‑run lint after auto-fix to ensure zero warnings (required)
npm run lint --workspace=@stock-charts/client -- --max-warnings=0
```

**Requirements:**

- ✅ Zero ESLint errors
- ✅ Zero TypeScript compilation errors
- ✅ Zero Angular template errors
- ❌ **Never suppress** `@typescript-eslint` rules without approval
- ❌ **Never use** `@ts-ignore` or `any` types

### 3. Building and compilation

**Frontend build:**

```bash
# Build Angular application
npm run build --workspace=@stock-charts/client

# Production build test
npm run build:prod --workspace=@stock-charts/client
```

**Backend build:**

```bash
# Build .NET solution
dotnet build Charts.sln

# Clean and rebuild to verify dependencies
dotnet clean Charts.sln
dotnet build Charts.sln
```

**Requirements:**

- ✅ All builds complete successfully
- ✅ Zero compilation errors or warnings
- ✅ All dependencies resolve correctly

### 4. Testing and validation

**Frontend testing:**

```bash
# Run unit tests
npm run test --workspace=@stock-charts/client

# Run with coverage
npm run test:coverage --workspace=@stock-charts/client
```

**Backend testing:**

```bash
# Run .NET tests
dotnet test Charts.sln

# With detailed output
dotnet test Charts.sln --verbosity normal
```

**Requirements:**

- ✅ All existing tests pass
- ✅ New functionality has unit tests
- ✅ Test coverage maintained or improved
- ✅ No ignored or skipped tests without justification

### 5. Documentation requirements

**Inline documentation:**

- ✅ **Public methods**: JSDoc/XML documentation for public APIs
- ✅ **Complex logic**: Comments explaining business rules and algorithms
- ✅ **Configuration**: Comments for environment variables and settings
- ✅ **Type definitions**: Comprehensive interface and type documentation

**File-level documentation:**

- ✅ **New features**: Update relevant README sections
- ✅ **API changes**: Update endpoint documentation
- ✅ **Configuration changes**: Update setup instructions
- ❌ **Avoid duplication**: Reference existing docs instead of copying

**Documentation linting:**

```bash
# Lint all markdown files
npm run lint:md

# Auto-fix markdown issues
npm run lint:md:fix
```

### 6. Integration and system checks

**Local development verification:**

```bash
# Start full development stack
npm start  # Angular dev server
# In separate terminals:
npm run azure:start    # Azurite storage
cd server/Functions && func start    # Azure Functions
cd server/WebApi && dotnet run       # Web API
```

**Requirements:**

- ✅ All services start without errors
- ✅ Frontend connects to backend successfully
- ✅ API endpoints respond correctly
- ✅ No console errors in browser dev tools

### 7. Git and commit preparation

**Pre-commit verification:**

```bash
# Check git status
git status

# Review all changes
git diff

# Stage files appropriately
git add .

# Verify staged changes
git diff --staged
```

**Requirements:**

- ✅ All formatting and linting checks pass
- ✅ No unintended files in commit
- ✅ Commit message follows conventional commit format
- ✅ No merge conflicts or unstaged changes

## Quality gates (all must pass)

### ✅ Code quality gates

- [ ] Zero linting errors or warnings
- [ ] Zero compilation errors or warnings
- [ ] All formatting checks pass
- [ ] No suppressed linting rules without approval

### ✅ Build and test gates

- [ ] Frontend builds successfully (dev and prod)
- [ ] Backend builds successfully
- [ ] All unit tests pass
- [ ] Integration tests pass (if applicable)

### ✅ Documentation gates

- [ ] Inline comments for complex logic
- [ ] Public API documentation complete
- [ ] README updated for new features
- [ ] Markdown linting passes

### ✅ Integration gates

- [ ] Local development stack runs without errors
- [ ] API endpoints function correctly
- [ ] No browser console errors
- [ ] Database migrations work (if applicable)

## Common troubleshooting

### Build failures

```bash
# Clear caches and reinstall
npm run clean
npm install
dotnet clean Charts.sln
dotnet restore Charts.sln
```

### Linting issues

```bash
# Auto-fix what's possible
npm run lint:fix --workspace=@stock-charts/client
npm run format

# Check specific rule violations
# Enforce zero warnings explicitly (same as quality gate)
npm run lint --workspace=@stock-charts/client -- --max-warnings=0

# Use default (stylish) or specify a supported formatter (e.g., 'stylish')
# List available formatters: npx eslint --help | grep format
npx eslint client/src --format=stylish --max-warnings=0
```

### Test failures

```bash
# Run tests in watch mode for debugging
npm run test:watch --workspace=@stock-charts/client

# Run specific test files
npm run test --workspace=@stock-charts/client -- --testNamePattern="ComponentName"
```

## VS Code integration

**Recommended workflow:**

1. Use Command Palette (`Ctrl+Shift+P`) → "Tasks: Run Task"
2. Available tasks: `build-website`, `build-server`, `lint-website-fix`, etc.
3. Use integrated terminal for manual commands
4. Leverage problem panel for error navigation

**Essential extensions:**

- ESLint (code linting)
- Prettier (code formatting)
- C# Dev Kit (.NET development)
- Angular Language Service (Angular support)

## Enforcement and exceptions

**Zero-tolerance items:**

- Build failures
- Test failures
- ESLint errors
- TypeScript compilation errors

**Approval-required exceptions:**

- ESLint rule suppressions
- TypeScript `any` types
- Skipped or ignored tests
- Missing documentation for public APIs

**Automatic rejection criteria:**

- Unformatted code
- Unresolved merge conflicts
- Failing CI/CD pipelines
- Missing or broken documentation links

---

Last updated: August 15, 2025
