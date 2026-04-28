import DefaultTheme from "vitepress/theme";

import { setupIndyChartsForVitePress } from "@facioquo/indy-charts/vitepress";

import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    setupIndyChartsForVitePress(app, {
      api: {
        baseUrl: "https://localhost:5001"
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
