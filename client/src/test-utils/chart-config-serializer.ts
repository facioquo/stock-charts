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

// Jest snapshot serializer printer signature
// Using 'any' here to align with Jest's expected plugin types while keeping
// internal normalization strongly typed.
// Match Jest Printer signature loosely while avoiding 'any' in our implementation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Printer = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  val: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any,
  indentation: string,
  depth: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  refs: any
) => string;

export const chartConfigSerializer = {
  test: (val: unknown) => {
    const obj = val as ChartLikeObject | null;
    return !!(obj && typeof obj === "object" && (obj.type ?? obj.data ?? obj.options));
  },

  serialize: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    val: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: any,
    indentation: string,
    depth: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    refs: any,
    printer: Printer
  ): string => {
    // Clone the object to avoid mutating the original
    const sanitized: unknown = JSON.parse(JSON.stringify(val));

    // Remove or normalize dynamic/unstable values
    const normalize = (obj: unknown): unknown => {
      if (Array.isArray(obj)) return obj.map(normalize);
      if (obj && typeof obj === "object") {
        const source = obj as Record<string, unknown>;
        const normalized: Record<string, unknown> = {};
        Object.entries(source).forEach(([key, value]) => {
          if (key === "id" || key === "guid" || key === "_id") normalized[key] = "[DYNAMIC_ID]";
          else if (typeof value === "function") normalized[key] = "[Function]";
          else if (key.toLowerCase().includes("time") && typeof value === "number")
            normalized[key] = "[TIMESTAMP]";
          else if (key.toLowerCase().includes("color") && typeof value === "string")
            normalized[key] = value.toLowerCase();
          else normalized[key] = normalize(value);
        });
        return normalized;
      }
      return obj;
    };

    const normalizedConfig = normalize(sanitized) as unknown;

    // Sort object keys for consistent output
    const sortKeys = (obj: unknown): unknown => {
      if (Array.isArray(obj)) return obj.map(sortKeys);
      if (obj && typeof obj === "object") {
        const source = obj as Record<string, unknown>;
        const sorted: Record<string, unknown> = {};
        Object.keys(source)
          .sort()
          .forEach(k => {
            sorted[k] = sortKeys(source[k]);
          });
        return sorted;
      }
      return obj;
    };

    const sortedConfig = sortKeys(normalizedConfig);

    return printer(sortedConfig, config, indentation, depth, refs);
  }
};

/**
 * Install the chart config serializer
 */
export function installChartConfigSerializer(): void {
  expect.addSnapshotSerializer(chartConfigSerializer);
}
