import DefaultTheme from "vitepress/theme";
import type { App } from "vue";

import { setupIndyChartsForVue } from "@facioquo/indy-charts/vue";

// @ts-expect-error - CSS file import for side effects
import "./custom.css";

const PROD_API_URL = "https://stock-charts-api.azurewebsites.net";
const LOCAL_API_URL = "https://localhost:5001";
// VITE_API_URL is for local development only; production always uses the live API
// (guards against CF Pages dashboard env var misconfiguration). Dev defaults to
// the locally-hosted WebApi so `pnpm dev` works without setting VITE_API_URL.
const apiUrl = import.meta.env.DEV
  ? ((import.meta.env.VITE_API_URL as string | undefined) ?? LOCAL_API_URL)
  : PROD_API_URL;

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: { app: App }) {
    setupIndyChartsForVue(app, {
      api: {
        baseUrl: apiUrl
      },
      defaults: {
        barCount: 250,
        quoteCount: 250,
        showTooltips: false
      },
      theme: {
        isDarkTheme: true,
        observeVitePressDarkMode: true,
        darkBackground: "#1b1b1f80",
        lightBackground: "#ffffff80"
      },
      indicators: {
        ema: {
          uiid: "EMA",
          title: "EMA(20)",
          params: { lookbackPeriods: 20 }
        },
        rsi: {
          uiid: "RSI",
          title: "RSI(14)",
          params: { lookbackPeriods: 14 },
          results: ["rsi"]
        },
        bb: {
          uiid: "BB",
          title: "Bollinger Bands(20,2)",
          params: { lookbackPeriods: 20, standardDeviations: 2 }
        },
        bbPctB: {
          uiid: "BB-PCTB",
          title: "Bollinger Bands %B(20,2)",
          params: { lookbackPeriods: 20, standardDeviations: 2 },
          results: ["percentB"]
        }
      }
    });
  }
};
