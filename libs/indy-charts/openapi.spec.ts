import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { parse } from "yaml";
import { describe, expect, it } from "vitest";

/**
 * Two-sided assertion for the published interface contract, mirroring how
 * `server/quote-dataset.contract.json` is asserted from both the Worker and the
 * .NET test suite.
 *
 * `openapi.yml` is the interface consumers implement, and it is prose plus
 * schemas — nothing about it fails to compile when it drifts from the types it
 * claims to describe. These tests fail instead.
 *
 * Structural validity is `pnpm run lint:openapi` (Redocly); this file covers the
 * agreement between the document, the package manifest, and the TypeScript types.
 */

const here = fileURLToPath(new URL(".", import.meta.url));
const spec = parse(readFileSync(`${here}openapi.yml`, "utf8")) as OpenApiDocument;
const manifest = JSON.parse(readFileSync(`${here}package.json`, "utf8")) as {
  files: string[];
};

interface SchemaObject {
  required?: string[];
  properties?: Record<string, unknown>;
  enum?: string[];
}

interface OpenApiDocument {
  paths: Record<string, Record<string, { operationId?: string }>>;
  components: { schemas: Record<string, SchemaObject> };
}

const schemas = spec.components.schemas;
const propertiesOf = (name: string): string[] => Object.keys(schemas[name].properties ?? {});

describe("openapi.yml ships with the package", () => {
  it("is listed in the published files", () => {
    // A rename here silently stops shipping the spec: the package still builds,
    // publishes, and installs, and consumers simply find nothing.
    expect(manifest.files).toContain("openapi.yml");
  });
});

describe("openapi.yml documents the operations the client calls", () => {
  it("covers exactly the three ApiClient methods", () => {
    const operations = Object.values(spec.paths)
      .flatMap(methods => Object.values(methods))
      .map(operation => operation.operationId)
      .sort();

    expect(operations).toEqual(["getIndicatorCatalog", "getIndicatorData", "getQuotes"]);
  });

  it("names the indicator path consistently with its parameter", () => {
    // The path template and its parameter drifted apart once already: the README
    // called it `/{endpoint}` while the spec called it `/{indicator}`.
    const [indicatorPath] = Object.keys(spec.paths).filter(p => p.includes("{"));
    expect(indicatorPath).toBe("/{indicatorPath}");
  });
});

describe("schemas agree with the exported TypeScript types", () => {
  // Kept literal rather than derived: a type change should fail here loudly and
  // make someone decide whether the published contract changes too.
  it("Bar carries the OHLCV fields the client requires", () => {
    expect(schemas.Bar.required).toEqual(["timestamp", "open", "high", "low", "close", "volume"]);
  });

  it("IndicatorListing declares every field the picker reads", () => {
    expect(propertiesOf("IndicatorListing")).toEqual([
      "name",
      "uiid",
      "legendTemplate",
      "endpoint",
      "category",
      "chartType",
      "order",
      "chartConfig",
      "parameters",
      "results"
    ]);
  });

  it("IndicatorParamConfig declares what the client sends as query parameters", () => {
    expect(propertiesOf("IndicatorParamConfig")).toEqual([
      "displayName",
      "paramName",
      "dataType",
      "defaultValue",
      "minimum",
      "maximum"
    ]);
  });

  it("chartType admits only the two panes the library renders", () => {
    expect(schemas.IndicatorListing.properties?.chartType).toMatchObject({
      enum: ["overlay", "oscillator"]
    });
  });

  it("CandlestickShape declares the metrics the candle description promises", () => {
    // The description listed these before the schema did, so a schema-driven
    // consumer saw none of them.
    expect(schemas.CandlestickShape.required).toEqual([
      "size",
      "body",
      "upperWick",
      "lowerWick",
      "bodyPct",
      "upperWickPct",
      "lowerWickPct",
      "isBullish",
      "isBearish"
    ]);
  });
});
