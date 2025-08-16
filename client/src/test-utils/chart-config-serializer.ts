/**
 * Custom snapshot serializer for Chart.js configurations
 * Part of issue #414 - Hardening Chart Testing Strategy
 * Strips dynamic values like GUIDs for stable snapshots
 */

export const chartConfigSerializer = {
  test: (val: any) => {
    return val && typeof val === "object" && (val.type || val.data || val.options);
  },

  serialize: (
    val: any,
    config: any,
    indentation: string,
    depth: number,
    refs: any,
    printer: any
  ) => {
    // Clone the object to avoid mutating the original
    const sanitized = JSON.parse(JSON.stringify(val));

    // Remove or normalize dynamic/unstable values
    const normalize = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(normalize);
      }

      if (obj && typeof obj === "object") {
        const normalized: any = {};

        for (const [key, value] of Object.entries(obj)) {
          // Skip unstable/dynamic properties
          if (key === "id" || key === "guid" || key === "_id") {
            normalized[key] = "[DYNAMIC_ID]";
          }
          // Normalize function references
          else if (typeof value === "function") {
            normalized[key] = "[Function]";
          }
          // Normalize timestamps
          else if (key.toLowerCase().includes("time") && typeof value === "number") {
            normalized[key] = "[TIMESTAMP]";
          }
          // Normalize colors that might have slight variations
          else if (key.toLowerCase().includes("color") && typeof value === "string") {
            normalized[key] = value.toLowerCase();
          }
          // Recursively normalize nested objects
          else {
            normalized[key] = normalize(value);
          }
        }

        return normalized;
      }

      return obj;
    };

    const normalizedConfig = normalize(sanitized);

    // Sort object keys for consistent output
    const sortKeys = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(sortKeys);
      }

      if (obj && typeof obj === "object") {
        const sorted: any = {};
        Object.keys(obj)
          .sort()
          .forEach(key => {
            sorted[key] = sortKeys(obj[key]);
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
