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

const defaultApi = import.meta.env.PROD
  ? "https://stock-charts-api.azurewebsites.net"
  : "https://localhost:5001";

export const env: EnvConfig = {
  production: import.meta.env.PROD,
  api: import.meta.env.VITE_API_URL ?? defaultApi,
  useChartLibrary: false
};
