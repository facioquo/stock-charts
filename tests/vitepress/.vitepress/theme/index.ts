import DefaultTheme from "vitepress/theme";

import { setupIndyChartsForVue } from "@facioquo/indy-charts/vue";

import "./custom.css";

const apiUrl =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "https://stock-charts-api.azurewebsites.net";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    setupIndyChartsForVue(app, {
      api: {
        baseUrl: apiUrl
      },
      defaults: {
        barCount: 250,
        quoteCount: 250,
        showTooltips: true
      },
      theme: {
        isDarkTheme: true,
        observeVitePressDarkMode: true
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
        }
      }
    });
  }
};
