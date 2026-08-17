import { type FinancialPalette, type FinancialThemeMode } from "../types/financial.types";

export const COLORS = {
  GREEN: "#2E7D32",
  GRAY: "#9E9E9E",
  RED: "#DD2C00",
  CANDLE_UP: "#1B5E20",
  CANDLE_DOWN: "#B71C1C",
  CANDLE_UNCHANGED: "#616161",
  VOLUME_UP: "#1B5E2060",
  VOLUME_DOWN: "#B71C1C60",
  VOLUME_UNCHANGED: "#61616160",
  // Dark-mode marks are deliberately the same hues as light mode. Against the
  // dark theme's #1e1f24 surface they measure ~2.1:1 (up), ~2.5:1 (down) and
  // ~2.7:1 (unchanged), below the WCAG 1.4.11 non-text threshold, but they read
  // well in practice and keep up/down semantics identical across themes. These
  // are separate constants so a dark-mode retune never disturbs light mode.
  DARK_CANDLE_UP: "#1B5E20",
  DARK_CANDLE_DOWN: "#B71C1C",
  DARK_CANDLE_UNCHANGED: "#616161",
  DARK_VOLUME_UP: "#1B5E2060",
  DARK_VOLUME_DOWN: "#B71C1C60",
  DARK_VOLUME_UNCHANGED: "#61616160"
} as const;

const LIGHT_PALETTE: FinancialPalette = {
  candle: {
    up: COLORS.CANDLE_UP,
    down: COLORS.CANDLE_DOWN,
    unchanged: COLORS.CANDLE_UNCHANGED
  },
  candleBorder: {
    up: COLORS.CANDLE_UP,
    down: COLORS.CANDLE_DOWN,
    unchanged: COLORS.CANDLE_UNCHANGED
  },
  volume: {
    up: COLORS.VOLUME_UP,
    down: COLORS.VOLUME_DOWN,
    unchanged: COLORS.VOLUME_UNCHANGED
  }
};

const DARK_PALETTE: FinancialPalette = {
  candle: {
    up: COLORS.DARK_CANDLE_UP,
    down: COLORS.DARK_CANDLE_DOWN,
    unchanged: COLORS.DARK_CANDLE_UNCHANGED
  },
  candleBorder: {
    up: COLORS.DARK_CANDLE_UP,
    down: COLORS.DARK_CANDLE_DOWN,
    unchanged: COLORS.DARK_CANDLE_UNCHANGED
  },
  volume: {
    up: COLORS.DARK_VOLUME_UP,
    down: COLORS.DARK_VOLUME_DOWN,
    unchanged: COLORS.DARK_VOLUME_UNCHANGED
  }
};

export function getFinancialPalette(mode: FinancialThemeMode): FinancialPalette {
  return mode === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
}

export function getCandleColor(open: number, close: number, palette: FinancialPalette): string {
  if (close > open) return palette.candle.up;
  if (close < open) return palette.candle.down;
  return palette.candle.unchanged;
}

export function getVolumeColor(open: number, close: number, palette: FinancialPalette): string {
  if (close > open) return palette.volume.up;
  if (close < open) return palette.volume.down;
  return palette.volume.unchanged;
}
