import DefaultTheme from "vitepress/theme";

import { setupIndyChartsForVue } from "@facioquo/indy-charts/vue";

import "./custom.css";

const PROD_API_URL = "https://stock-charts-api.azurewebsites.net";
// VITE_API_URL is for local development only; production always uses the live API
// (guards against CF Pages dashboard env var misconfiguration)
const apiUrl = import.meta.env.DEV
  ? ((import.meta.env.VITE_API_URL as string | undefined) ?? PROD_API_URL)
  : PROD_API_URL;

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
        }
      }
    });
  }
};
