# @stock-charts/web

React + Vite + React Router frontend for the Stock Charts demo, per the org React standard.

## What is here

- **Entry / routing** — `src/main.tsx`, `src/router.tsx`
- **App shell + pages** — `src/components/App.tsx`, `src/pages/ChartPage.tsx`, `src/pages/NotFound.tsx`
- **API client (fetch, backup fallback)** — `src/api/apiClient.ts`
- **Chart orchestration** — `src/charting/chartController.ts`, `src/charting/useChart.ts`
- **Ported services** — `src/services/userPrefs.ts`, `src/services/windowSize.ts`, `src/services/meta.ts`
- **Config / types** — `src/config/env.ts`, `src/types/chart.types.ts`

The framework-agnostic `@facioquo/indy-charts` `ChartManager` and the .NET backend are reused unchanged.

## Commands

```bash
pnpm --filter @stock-charts/web dev       # Vite dev server (http://localhost:4200)
pnpm --filter @stock-charts/web build     # tsc --noEmit && vite build -> dist/app
pnpm --filter @stock-charts/web test      # Vitest
```

`VITE_API_URL` overrides the backend base URL (defaults: `https://localhost:5001` in dev, the Cloudflare Worker API in production).
