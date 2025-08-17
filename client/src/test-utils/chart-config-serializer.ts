/**
 * Custom snapshot serializer for Chart.js configurations
 * Part of issue #414 - Hardening Chart Testing Strategy
 * Strips dynamic values like GUIDs for stable snapshots
 */

export interface ChartLikeObject {
  type?: unknown;
  data?: unknown;
  options?: unknown;
  [key: string]: unknown;
}

// Import pretty-format types (Jest internally re-exports these for plugin shapes)
// Using type-only import avoids adding runtime dependency cost.
import type {
  NewPlugin,
  Config as PrettyFormatConfig,
  Printer as PrettyFormatPrinter
} from "pretty-format";

// Printer type specialized for our normalized chart config structure.
type Printer = PrettyFormatPrinter;

// Narrow plugin value types we accept (chart-like objects)
type ChartSerializable = Record<string, unknown> | unknown[];

export const chartConfigSerializer: NewPlugin = {
  test: (val: unknown): boolean => {
    const obj = val as ChartLikeObject | null;
    return !!(obj && typeof obj === "object" && (obj.type ?? obj.data ?? obj.options));
  },
  serialize: (
    val: ChartSerializable,
    config: PrettyFormatConfig,
    indentation: string,
    depth: number,
    refs: unknown[],
    printer: Printer
  ): string => {
    // Clone via JSON for deterministic deep copy of POJO data.
    const sanitized: ChartSerializable = JSON.parse(JSON.stringify(val)) as ChartSerializable;

    const normalize = (obj: unknown): unknown => {
      if (Array.isArray(obj)) return obj.map(normalize);
      if (obj && typeof obj === "object") {
        const source = obj as Record<string, unknown>;
        const normalized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(source)) {
          const lower = key.toLowerCase();
          if (key === "id" || key === "guid" || key === "_id") normalized[key] = "[DYNAMIC_ID]";
          else if (typeof value === "function") normalized[key] = "[Function]";
          else if (lower.includes("time") && typeof value === "number")
            normalized[key] = "[TIMESTAMP]";
          else if (lower.includes("color") && typeof value === "string")
            normalized[key] = value.toLowerCase();
          else normalized[key] = normalize(value);
        }
        return normalized;
      }
      return obj;
    };

    const sortKeys = (obj: unknown): unknown => {
      if (Array.isArray(obj)) return obj.map(sortKeys);
      if (obj && typeof obj === "object") {
        const source = obj as Record<string, unknown>;
        const sorted: Record<string, unknown> = {};
        for (const k of Object.keys(source).sort()) {
          sorted[k] = sortKeys(source[k]);
        }
        return sorted;
      }
      return obj;
    };

    const normalizedConfig = normalize(sanitized);
    const sortedConfig = sortKeys(normalizedConfig);
    return printer(sortedConfig, config, indentation, depth, refs as unknown[]);
  }
};

/**
 * Install the chart config serializer
 */
export function installChartConfigSerializer(): void {
  expect.addSnapshotSerializer(chartConfigSerializer);
}
