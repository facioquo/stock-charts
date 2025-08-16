import { IndicatorListing } from "../pages/chart/chart.models";

// Chart colors constants
const ChartColors = {
  StandardBlue: "#007bff",
  StandardRed: "#dc3545",
  StandardGreen: "#28a745",
  StandardOrange: "#fd7e14",
  StandardPurple: "#6f42c1",
  StandardGray: "#6c757d",
  StandardGrayTransparent: "#6c757d80",
  DarkGray: "#343a40",
  DarkGrayTransparent: "#343a4080",
  ThresholdRed: "#dc354580",
  ThresholdGreen: "#28a74580",
  ThresholdGrayTransparent: "#6c757d40",
  ThresholdRedTransparent: "#dc354520",
  ThresholdGreenTransparent: "#28a74520"
};

/**
 * Backup indicator listings for client-side failover when API is unavailable.
 * Contains essential technical indicators commonly used in financial analysis.
 */
export const CLIENT_BACKUP_INDICATORS: IndicatorListing[] = [
  // Simple Moving Average
  {
    name: "Simple Moving Average (SMA)",
    uiid: "SMA",
    legendTemplate: "SMA([P1])",
    endpoint: "/SMA/",
    category: "moving-average",
    chartType: "overlay",
    order: 0,
    chartConfig: null,
    parameters: [
      {
        displayName: "Lookback Periods",
        paramName: "lookbackPeriods",
        dataType: "int",
        defaultValue: 10,
        minimum: 1,
        maximum: 250
      }
    ],
    results: [
      {
        displayName: "SMA",
        tooltipTemplate: "SMA([P1])",
        dataName: "sma",
        dataType: "number",
        lineType: "solid",
        stack: "",
        lineWidth: null,
        defaultColor: ChartColors.StandardBlue,
        fill: {
          target: "",
          colorAbove: "",
          colorBelow: ""
        },
        order: 0
      }
    ]
  },

  // Exponential Moving Average
  {
    name: "Exponential Moving Average (EMA)",
    uiid: "EMA",
    legendTemplate: "EMA([P1])",
    endpoint: "/EMA/",
    category: "moving-average",
    chartType: "overlay",
    order: 0,
    chartConfig: null,
    parameters: [
      {
        displayName: "Lookback Periods",
        paramName: "lookbackPeriods",
        dataType: "int",
        defaultValue: 20,
        minimum: 1,
        maximum: 250
      }
    ],
    results: [
      {
        displayName: "EMA",
        tooltipTemplate: "EMA([P1])",
        dataName: "ema",
        dataType: "number",
        lineType: "solid",
        stack: "",
        lineWidth: null,
        defaultColor: ChartColors.StandardBlue,
        fill: {
          target: "",
          colorAbove: "",
          colorBelow: ""
        },
        order: 0
      }
    ]
  },

  // Relative Strength Index
  {
    name: "Relative Strength Index (RSI)",
    uiid: "RSI",
    legendTemplate: "RSI([P1])",
    endpoint: "/RSI/",
    category: "oscillator",
    chartType: "oscillator",
    order: 0,
    chartConfig: {
      minimumYAxis: 0,
      maximumYAxis: 100,
      thresholds: [
        {
          value: 70,
          color: ChartColors.ThresholdRed,
          style: "dash",
          fill: {
            target: "+2",
            colorAbove: "transparent",
            colorBelow: ChartColors.ThresholdGreen
          }
        },
        {
          value: 30,
          color: ChartColors.ThresholdGreen,
          style: "dash",
          fill: {
            target: "+1",
            colorAbove: ChartColors.ThresholdRed,
            colorBelow: "transparent"
          }
        }
      ]
    },
    parameters: [
      {
        displayName: "Lookback Periods",
        paramName: "lookbackPeriods",
        dataType: "int",
        defaultValue: 14,
        minimum: 1,
        maximum: 250
      }
    ],
    results: [
      {
        displayName: "RSI",
        tooltipTemplate: "RSI([P1])",
        dataName: "rsi",
        dataType: "number",
        lineType: "solid",
        stack: "",
        lineWidth: null,
        defaultColor: ChartColors.StandardBlue,
        fill: {
          target: "",
          colorAbove: "",
          colorBelow: ""
        },
        order: 0
      }
    ]
  },

  // MACD
  {
    name: "Moving Average Convergence/Divergence (MACD)",
    uiid: "MACD",
    legendTemplate: "MACD([P1],[P2],[P3])",
    endpoint: "/MACD/",
    category: "price-trend",
    chartType: "oscillator",
    order: 0,
    chartConfig: {
      minimumYAxis: null,
      maximumYAxis: null,
      thresholds: [
        {
          value: 0,
          color: ChartColors.DarkGrayTransparent,
          style: "dash",
          fill: {
            target: "",
            colorAbove: "",
            colorBelow: ""
          }
        }
      ]
    },
    parameters: [
      {
        displayName: "Fast Periods",
        paramName: "fastPeriods",
        dataType: "int",
        defaultValue: 12,
        minimum: 1,
        maximum: 200
      },
      {
        displayName: "Slow Periods",
        paramName: "slowPeriods",
        dataType: "int",
        defaultValue: 26,
        minimum: 1,
        maximum: 250
      },
      {
        displayName: "Signal Periods",
        paramName: "signalPeriods",
        dataType: "int",
        defaultValue: 9,
        minimum: 1,
        maximum: 50
      }
    ],
    results: [
      {
        displayName: "MACD",
        tooltipTemplate: "MACD",
        dataName: "macd",
        dataType: "number",
        lineType: "solid",
        stack: "",
        lineWidth: null,
        defaultColor: ChartColors.StandardBlue,
        fill: {
          target: "",
          colorAbove: "",
          colorBelow: ""
        },
        order: 0
      },
      {
        displayName: "Signal",
        tooltipTemplate: "Signal",
        dataName: "signal",
        dataType: "number",
        lineType: "solid",
        stack: "",
        lineWidth: null,
        defaultColor: ChartColors.StandardRed,
        fill: {
          target: "",
          colorAbove: "",
          colorBelow: ""
        },
        order: 1
      },
      {
        displayName: "Histogram",
        tooltipTemplate: "Histogram",
        dataName: "histogram",
        dataType: "number",
        lineType: "bar",
        stack: "",
        lineWidth: null,
        defaultColor: ChartColors.StandardGrayTransparent,
        fill: {
          target: "",
          colorAbove: "",
          colorBelow: ""
        },
        order: 2
      }
    ]
  },

  // Bollinger Bands
  {
    name: "Bollinger Bands®",
    uiid: "BB",
    legendTemplate: "BB([P1],[P2])",
    endpoint: "/BB/",
    category: "price-channel",
    chartType: "overlay",
    order: 0,
    chartConfig: null,
    parameters: [
      {
        displayName: "Lookback Periods",
        paramName: "lookbackPeriods",
        dataType: "int",
        defaultValue: 20,
        minimum: 2,
        maximum: 250
      },
      {
        displayName: "Standard Deviations",
        paramName: "standardDeviations",
        dataType: "number",
        defaultValue: 2,
        minimum: 0.01,
        maximum: 10
      }
    ],
    results: [
      {
        displayName: "Upper Band",
        tooltipTemplate: "BB([P1],[P2]) Upper Band",
        dataName: "upperBand",
        dataType: "number",
        lineType: "solid",
        stack: "",
        lineWidth: 1,
        defaultColor: ChartColors.DarkGray,
        fill: {
          target: "+2",
          colorAbove: ChartColors.DarkGrayTransparent,
          colorBelow: ChartColors.DarkGrayTransparent
        },
        order: 0
      },
      {
        displayName: "Centerline",
        tooltipTemplate: "BB([P1],[P2]) Centerline",
        dataName: "sma",
        dataType: "number",
        lineType: "dash",
        stack: "",
        lineWidth: 1,
        defaultColor: ChartColors.DarkGray,
        fill: {
          target: "",
          colorAbove: "",
          colorBelow: ""
        },
        order: 1
      },
      {
        displayName: "Lower Band",
        tooltipTemplate: "BB([P1],[P2]) Lower Band",
        dataName: "lowerBand",
        dataType: "number",
        lineType: "solid",
        stack: "",
        lineWidth: 1,
        defaultColor: ChartColors.DarkGray,
        fill: {
          target: "",
          colorAbove: "",
          colorBelow: ""
        },
        order: 2
      }
    ]
  },

  // Stochastic Oscillator
  {
    name: "Stochastic Oscillator",
    uiid: "STO",
    legendTemplate: "STOCH %K([P1]) %D([P2])",
    endpoint: "/STO/",
    category: "oscillator",
    chartType: "oscillator",
    order: 0,
    chartConfig: {
      minimumYAxis: null,
      maximumYAxis: null,
      thresholds: [
        {
          value: 80,
          color: ChartColors.ThresholdRed,
          style: "dash",
          fill: {
            target: "+2",
            colorAbove: "transparent",
            colorBelow: ChartColors.ThresholdGreen
          }
        },
        {
          value: 20,
          color: ChartColors.ThresholdGreen,
          style: "dash",
          fill: {
            target: "+1",
            colorAbove: ChartColors.ThresholdRed,
            colorBelow: "transparent"
          }
        }
      ]
    },
    parameters: [
      {
        displayName: "Lookback Periods (%K)",
        paramName: "lookbackPeriods",
        dataType: "int",
        defaultValue: 14,
        minimum: 1,
        maximum: 250
      },
      {
        displayName: "Signal Periods (%D)",
        paramName: "signalPeriods",
        dataType: "int",
        defaultValue: 3,
        minimum: 1,
        maximum: 250
      }
    ],
    results: [
      {
        displayName: "%K",
        tooltipTemplate: "STO %K([P1])",
        dataName: "k",
        dataType: "number",
        lineType: "solid",
        stack: "",
        lineWidth: null,
        defaultColor: ChartColors.StandardBlue,
        fill: {
          target: "",
          colorAbove: "",
          colorBelow: ""
        },
        order: 0
      },
      {
        displayName: "%D",
        tooltipTemplate: "STO %D([P2])",
        dataName: "d",
        dataType: "number",
        lineType: "solid",
        stack: "",
        lineWidth: null,
        defaultColor: ChartColors.StandardRed,
        fill: {
          target: "",
          colorAbove: "",
          colorBelow: ""
        },
        order: 1
      }
    ]
  },

  // Average True Range
  {
    name: "Average True Range (ATR)",
    uiid: "ATR",
    legendTemplate: "ATR([P1])",
    endpoint: "/ATR/",
    category: "price-characteristic",
    chartType: "oscillator",
    order: 0,
    chartConfig: null,
    parameters: [
      {
        displayName: "Lookback Periods",
        paramName: "lookbackPeriods",
        dataType: "int",
        defaultValue: 14,
        minimum: 2,
        maximum: 250
      }
    ],
    results: [
      {
        displayName: "Average True Range",
        tooltipTemplate: "ATR([P1])",
        dataName: "atr",
        dataType: "number",
        lineType: "solid",
        stack: "",
        lineWidth: null,
        defaultColor: ChartColors.StandardBlue,
        fill: {
          target: "",
          colorAbove: "",
          colorBelow: ""
        },
        order: 0
      }
    ]
  },

  // ATR Trailing Stop
  {
    name: "ATR Trailing Stop (Close offset)",
    uiid: "ATR-STOP-CLOSE",
    legendTemplate: "ATR-STOP([P1],[P2],CLOSE)",
    endpoint: "/ATR-STOP-CLOSE/",
    category: "price-trend",
    chartType: "overlay",
    order: 1,
    chartConfig: null,
    parameters: [
      {
        displayName: "Lookback Periods",
        paramName: "lookbackPeriods",
        dataType: "int",
        defaultValue: 21,
        minimum: 1,
        maximum: 50
      },
      {
        displayName: "Multiplier",
        paramName: "multiplier",
        dataType: "number",
        defaultValue: 3,
        minimum: 0.1,
        maximum: 10
      }
    ],
    results: [
      {
        displayName: "Buy Stop",
        tooltipTemplate: "ATR-STOP([P1],[P2],CLOSE) Buy Stop",
        dataName: "buyStop",
        dataType: "number",
        lineType: "dots",
        stack: "",
        lineWidth: 2,
        defaultColor: ChartColors.StandardGreen,
        fill: {
          target: "",
          colorAbove: "",
          colorBelow: ""
        },
        order: 0
      },
      {
        displayName: "Sell Stop",
        tooltipTemplate: "ATR-STOP([P1],[P2],CLOSE) Sell Stop",
        dataName: "sellStop",
        dataType: "number",
        lineType: "dots",
        stack: "",
        lineWidth: 2,
        defaultColor: ChartColors.StandardRed,
        fill: {
          target: "",
          colorAbove: "",
          colorBelow: ""
        },
        order: 1
      }
    ]
  },

  // Elder-ray Index
  {
    name: "Elder-ray Index",
    uiid: "ELDER-RAY",
    legendTemplate: "ELDER-RAY([P1])",
    endpoint: "/ELDER-RAY/",
    category: "price-trend",
    chartType: "oscillator",
    order: 0,
    chartConfig: null,
    parameters: [
      {
        displayName: "Lookback Periods",
        paramName: "lookbackPeriods",
        dataType: "int",
        defaultValue: 13,
        minimum: 1,
        maximum: 250
      }
    ],
    results: [
      {
        displayName: "Bull Power",
        tooltipTemplate: "Bull Power",
        dataName: "bullPower",
        dataType: "number",
        lineType: "bar",
        stack: "eray",
        lineWidth: null,
        defaultColor: ChartColors.StandardGreen,
        fill: {
          target: "",
          colorAbove: "",
          colorBelow: ""
        },
        order: 0
      },
      {
        displayName: "Bear Power",
        tooltipTemplate: "Bear Power",
        dataName: "bearPower",
        dataType: "number",
        lineType: "bar",
        stack: "eray",
        lineWidth: null,
        defaultColor: ChartColors.StandardRed,
        fill: {
          target: "",
          colorAbove: "",
          colorBelow: ""
        },
        order: 1
      }
    ]
  },

  // Stochastic Momentum Index
  {
    name: "Stochastic Momentum Index",
    uiid: "SMI",
    legendTemplate: "SMI([P1],[P2],[P3],[P4])",
    endpoint: "/SMI/",
    category: "oscillator",
    chartType: "oscillator",
    order: 0,
    chartConfig: {
      minimumYAxis: null,
      maximumYAxis: null,
      thresholds: [
        {
          value: 40,
          color: ChartColors.ThresholdRed,
          style: "dash",
          fill: {
            target: "+2",
            colorAbove: "transparent",
            colorBelow: ChartColors.ThresholdGreen
          }
        },
        {
          value: -40,
          color: ChartColors.ThresholdGreen,
          style: "dash",
          fill: {
            target: "+1",
            colorAbove: ChartColors.ThresholdRed,
            colorBelow: "transparent"
          }
        }
      ]
    },
    parameters: [
      {
        displayName: "Lookback Periods",
        paramName: "lookbackPeriods",
        dataType: "int",
        defaultValue: 13,
        minimum: 1,
        maximum: 300
      },
      {
        displayName: "First Smooth Periods",
        paramName: "firstSmoothPeriods",
        dataType: "int",
        defaultValue: 25,
        minimum: 1,
        maximum: 300
      },
      {
        displayName: "Second Smooth Periods",
        paramName: "secondSmoothPeriods",
        dataType: "int",
        defaultValue: 2,
        minimum: 1,
        maximum: 50
      },
      {
        displayName: "Signal Periods",
        paramName: "signalPeriods",
        dataType: "int",
        defaultValue: 9,
        minimum: 1,
        maximum: 50
      }
    ],
    results: [
      {
        displayName: "SMI",
        tooltipTemplate: "SMI",
        dataName: "smi",
        dataType: "number",
        lineType: "solid",
        stack: "",
        lineWidth: null,
        defaultColor: ChartColors.StandardBlue,
        fill: {
          target: "",
          colorAbove: "",
          colorBelow: ""
        },
        order: 0
      },
      {
        displayName: "Signal",
        tooltipTemplate: "Signal",
        dataName: "signal",
        dataType: "number",
        lineType: "solid",
        stack: "",
        lineWidth: null,
        defaultColor: ChartColors.StandardRed,
        fill: {
          target: "",
          colorAbove: "",
          colorBelow: ""
        },
        order: 1
      }
    ]
  }
];
