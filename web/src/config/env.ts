/**
 * Runtime environment config. Mirrors the Angular `environment.ts` /
 * `environment.prod.ts` pair, but driven by Vite's `import.meta.env`.
 *
 * - `production` follows Vite's build mode (`import.meta.env.PROD`).
 * - `api` defaults per mode, overridable via `VITE_API_URL` for previews.
 */
export interface EnvConfig {
  production: boolean;
  api: string;
  useChartLibrary?: boolean;
}

/**
 * Production API origin: the Cloudflare Worker that fronts the indicator API
 * container (see `server/edge`). Keep in sync with `PROD_API_URL` in
 * `tests/vitepress/.vitepress/theme/index.ts`.
 */
const PROD_API_URL = "https://charts-api.stockindicators.dev";

const defaultApi = import.meta.env.PROD ? PROD_API_URL : "https://localhost:5001";

export const env: EnvConfig = {
  production: import.meta.env.PROD,
  api: import.meta.env.VITE_API_URL ?? defaultApi,
  useChartLibrary: false
};
