# @stock-charts/web

React + Vite + React Router frontend for the Stock Charts demo — the migration
target replacing the Angular app in [`client/`](../client) per the org React
standard (ADR-0001).

> **Migration in progress.** This is the **foundation slice**. The app builds,
> tests pass, and the chart page renders default indicators (via backup data
> when the backend is offline). The settings/indicator-picker UI, full SCSS
> theme port, Playwright E2E, and Angular-toolchain removal land in stacked
> follow-up slices. `client/` remains the deployed app until parity is reached.

## What is here

| Layer                               | File(s)                                                                           |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| Entry / routing                     | `src/main.tsx`, `src/router.tsx`                                                  |
| App shell + pages                   | `src/components/App.tsx`, `src/pages/ChartPage.tsx`, `src/pages/NotFound.tsx`     |
| API client (fetch, backup fallback) | `src/api/apiClient.ts`                                                            |
| Chart orchestration                 | `src/charting/chartController.ts`, `src/charting/useChart.ts`                     |
| Ported services                     | `src/services/userPrefs.ts`, `src/services/windowSize.ts`, `src/services/meta.ts` |
| Config / types                      | `src/config/env.ts`, `src/types/chart.types.ts`                                   |

The framework-agnostic `@facioquo/indy-charts` `ChartManager` and the .NET
backend are reused unchanged.

## Commands

```bash
pnpm --filter @stock-charts/web dev       # Vite dev server (http://localhost:4200)
pnpm --filter @stock-charts/web build     # tsc --noEmit && vite build -> dist/app
pnpm --filter @stock-charts/web test      # Vitest
```

`VITE_API_URL` overrides the backend base URL (defaults: `https://localhost:5001`
in dev, the Azure API in production).
