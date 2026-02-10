# Chart.js v4.5.1 API Compliance Documentation

This document outlines how chartjs-financial adheres to Chart.js v4.5.1 API standards.

## Controller Implementation

### DatasetController Extension

Our controllers extend `DatasetController` (via `BarController` for `FinancialController`) following Chart.js v4.5.1 patterns:

```typescript
export class FinancialController extends BarController {
  static overrides = { /* ... */ };

  getLabelAndValue(index: number): { label: string; value: string } { /* ... */ }
  getAllParsedValues(): number[] { /* ... */ }
  getMinMax(scale: object): { min: number; max: number } { /* ... */ }
  calculateElementProperties(...): { /* ... */ } { /* ... */ }
  draw(): void { /* ... */ }
}

export class CandlestickController extends FinancialController {
  static id = "candlestick";
  static defaults = merge({ /* ... */ }, Chart.defaults.financial);

  updateElements(elements: unknown[], start: number, count: number, mode: string): void {
    // Chart.js v4.5.1 signature
  }
}

export class OhlcController extends FinancialController {
  static id = "ohlc";
  static defaults = merge({ /* ... */ }, Chart.defaults.financial);
}
```

### Key v4.5.1 Compliance Points

1. **`updateElements()` signature**: Matches v4.5.1 exactly
   - `elements: unknown[]` - Array of elements to update
   - `start: number` - Starting index
   - `count: number` - Number of elements to update
   - `mode: string` - Update mode ('reset', 'default', etc.)

2. **Static `defaults`**: Using `merge()` from Chart.js helpers to properly inherit defaults

3. **Static `id`**: Each controller has a unique identifier for registration

4. **Static `overrides`**: Proper override structure for Chart.js configuration

## Element Implementation

### Element Extension

Our elements extend `Element` from Chart.js:

```typescript
export class FinancialElement extends Element {
  declare x: number;
  declare y: number;
  declare base: number;
  declare low: number;
  declare high: number;
  declare open: number;
  declare close: number;
  declare direction: "up" | "down" | "unchanged";
  declare width: number;

  height(): number {
    /* ... */
  }
  inRange(mouseX: number, mouseY: number, useFinalPosition?: boolean): boolean {
    /* ... */
  }
  inXRange(mouseX: number, useFinalPosition?: boolean): boolean {
    /* ... */
  }
  inYRange(mouseY: number, useFinalPosition?: boolean): boolean {
    /* ... */
  }
  getRange(axis: "x" | "y"): number {
    /* ... */
  }
  getCenterPoint(useFinalPosition?: boolean): { x: number; y: number } {
    /* ... */
  }
  tooltipPosition(useFinalPosition?: boolean): { x: number; y: number } {
    /* ... */
  }
}
```

### Key v4.5.1 Element Compliance

1. **Proper property declarations**: Using TypeScript `declare` for element properties
2. **`inRange()` methods**: Implement interaction detection
3. **`getCenterPoint()` and `tooltipPosition()`**: Required for Chart.js tooltips and interactions
4. **`useFinalPosition` parameter**: Supports animation states

### Custom Elements

```typescript
export class CandlestickElement extends FinancialElement {
  static id = "candlestick";

  draw(ctx: CanvasRenderingContext2D): void {
    // Custom canvas rendering
  }
}

export class OhlcElement extends FinancialElement {
  static id = "ohlc";

  draw(ctx: CanvasRenderingContext2D): void {
    // Custom canvas rendering
  }
}
```

## Registration

### Chart.js v4.5.1 Registration Pattern

```typescript
import { Chart } from "chart.js";

export const financialRegisterables = [
  CandlestickController,
  OhlcController
  // ... other Chart.js components
] as const;

export function registerFinancialCharts(): void {
  if (registered) return;

  setFinancialDefaults();
  Chart.register(...financialRegisterables);
  registered = true;
}
```

**Compliance**: Uses `Chart.register()` which is the v4.5.1 standard way to register custom components.

## TypeScript Type Declarations

### Chart Type Registry Extension

```typescript
// types/financial-chart.registry.d.ts
import type {
  FinancialDataPoint,
  FinancialDatasetOptions,
  OhlcDatasetOptions
} from "../chartjs/financial";

declare module "chart.js" {
  interface ChartTypeRegistry {
    candlestick: {
      chartOptions: CoreChartOptions<"candlestick">;
      datasetOptions: FinancialDatasetOptions;
      defaultDataPoint: FinancialDataPoint;
      parsedDataType: { x: number; o: number; h: number; l: number; c: number };
      scales: keyof CartesianScaleTypeRegistry;
    };
    ohlc: {
      chartOptions: CoreChartOptions<"ohlc">;
      datasetOptions: OhlcDatasetOptions;
      defaultDataPoint: FinancialDataPoint;
      parsedDataType: { x: number; o: number; h: number; l: number; c: number };
      scales: keyof CartesianScaleTypeRegistry;
    };
  }
}
```

**Compliance**: Proper Chart.js v4.5+ module augmentation pattern for TypeScript.

## Defaults Configuration

### Using Chart.js Defaults System

```typescript
import { Chart } from "chart.js";

export function setFinancialDefaults(
  palette: FinancialPalette = defaultPalette
): void {
  const chartDefaults = Chart.defaults as unknown as FinancialChartDefaults;
  const elementDefaults = Chart.defaults
    .elements as unknown as FinancialElementDefaults;

  chartDefaults.financial = {
    color: { ...palette.candle }
  };

  elementDefaults.financial = {
    color: { ...palette.candle }
  };

  elementDefaults.ohlc = merge({}, [
    elementDefaults.financial,
    { lineWidth: 2, armLength: null, armLengthRatio: 0.8 }
  ]);

  elementDefaults.candlestick = merge({}, [
    elementDefaults.financial,
    {
      borderColor: { ...palette.candleBorder },
      borderWidth: 1
    }
  ]);
}
```

**Compliance**: Uses `Chart.defaults` which is the v4.5.1 way to configure global defaults.

## Helper Utilities

### Using Chart.js Helpers

```typescript
import {
  merge,
  valueOrDefault,
  isNullOrUndef,
  clipArea,
  unclipArea
} from "chart.js/helpers";
```

**Compliance**: All helper functions are from Chart.js v4.5.1 helpers module, not custom implementations.

## Animation Support

### Animation Properties

```typescript
static overrides = {
  datasets: {
    animation: {
      numbers: {
        type: "number",
        properties: ["x", "y", "base", "width", "open", "high", "low", "close"]
      }
    }
  }
};
```

**Compliance**: Uses Chart.js v4.5+ animation configuration structure.

## Parsing

### Custom Parsing

```typescript
static overrides = {
  parsing: false  // We handle our own parsing
};

interface FinancialDataPoint {
  x: number;
  o: number;
  h: number;
  l: number;
  c: number;
}
```

**Compliance**: Properly declares `parsing: false` and provides custom data structure, which is the recommended v4.5+ pattern for custom chart types.

## Tooltip Integration

### Tooltip Callbacks

```typescript
static overrides = {
  plugins: {
    tooltip: {
      intersect: false,
      mode: "index",
      callbacks: {
        label(ctx: { parsed: ParsedFinancialLike }): string {
          const { o, h, l, c } = ctx.parsed;
          return `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;
        }
      }
    }
  }
};
```

**Compliance**: Uses v4.5.1 tooltip callback signature with properly typed context.

## Summary

This financial chart extension is fully compliant with Chart.js v4.5.1:

✅ Extends proper base classes (`DatasetController`, `Element`)
✅ Uses correct method signatures for v4.5.1
✅ Proper registration via `Chart.register()`
✅ TypeScript declarations using module augmentation
✅ Uses Chart.js helpers instead of reimplementing utilities
✅ Follows v4.5+ animation and tooltip patterns
✅ No deprecated API usage
✅ Optimized for modern Chart.js rendering pipeline

The code is production-ready and can be extracted as a standalone npm package that depends on chart.js@^4.5.1.
