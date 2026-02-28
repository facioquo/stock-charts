# Task 5: Configure Library Build Pipeline and Package Metadata

## Scope & Objective

Set up TypeScript compilation, package.json metadata, and npm publishing configuration for the `@stock-charts/financial` library.

**In scope**:

- Update file:client/src/chartjs/financial/package.json for npm publishing
- Create client/src/chartjs/financial/tsconfig.lib.json for library compilation
- Add build scripts to file:client/package.json
- Configure peer dependencies (Chart.js, date adapters)
- Set up package exports and entry points

**Out of scope**:

- Actual npm publishing (manual step after validation)
- CI/CD pipeline for automated releases
- Versioning strategy (start with 1.0.0)

## References

**From Approach** (spec: [Chart System Extraction (approach)](02-approach.md)):

- Section 1: Design Decisions - "Package Naming: @stock-charts/financial"
- Section 2: Target State - "Library can be used in any framework"

## Guardrails

**Package configuration requirements**:

- Remove `"private": true` from package.json
- Set name to `@stock-charts/financial`
- Define Chart.js v4.5+ as peer dependency
- Include chartjs-adapter-date-fns and date-fns as optional peer dependencies
- Set license to MIT (matches current)

**Build configuration requirements**:

- Generate TypeScript declarations (`declaration: true`)
- Output ES2020 modules for modern consumers
- Exclude test files from build output
- Output to `dist/` directory

**Entry points**:

- `main`: CommonJS entry (for Node.js)
- `module`: ESM entry (for bundlers)
- `types`: TypeScript declarations
- `exports`: Modern package resolution

## Status: Complete (scope evolved — two private workspace packages, not published)

The build pipeline was implemented as two standalone pnpm workspace packages:
`libs/chartjs-financial/` (`@facioquo/chartjs-chart-financial`) and
`libs/indy-charts/` (`@facioquo/indy-charts`). Both are consumed via workspace
linking. Publishing to npm was deferred; packages remain `private: true`.

## Acceptance Criteria

> **Note**: Original plan named one package `@stock-charts/financial`. Actual
> implementation split into two packages with `@facioquo/` namespace.

- [x] `libs/chartjs-financial/package.json` configured with name, peer deps,
      entry points, and exports field
- [x] `libs/indy-charts/package.json` configured with name, peer deps
      (`chart.js ^4.5.1`, `chartjs-adapter-date-fns`, `date-fns`),
      entry points, and exports field
- [x] TypeScript build config (`tsconfig.json`) present in both library workspaces
- [x] Build succeeds for both libraries
- [x] Generated `dist/` contains `.js` and `.d.ts` files
- [ ] `"private": true` removed — **packages are still private, not publishable**
- [ ] Published to npm — **not done; packages consumed via workspace linking only**

## Verification Steps

1. Run build: `pnpm build:lib --workspace=@stock-charts/client`
2. Verify dist/ directory created with compiled files
3. Check dist/ contains:
   - JavaScript files (.js)
   - TypeScript declarations (.d.ts)
   - No test files (.spec.ts)

4. Run `pnpm pack --workspace=@stock-charts/client`
5. Extract .tgz and verify contents
6. Verify package size is reasonable (< 500KB)
