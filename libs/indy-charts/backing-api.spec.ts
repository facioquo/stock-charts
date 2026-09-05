import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { parse } from "yaml";
import { describe, expect, it } from "vitest";

import type { Bar, IndicatorListing, IndicatorParamConfig } from "./config";

/**
 * Pins the published contract against the three things that can silently stop
 * matching it: the exported TypeScript types, the package manifest, and the
 * document's own internal consistency.
 *
 * The field lists below run the check in both directions. `fieldsOf` binds each
 * list to its exported interface at compile time, so adding or renaming a field
 * on `Bar`, `IndicatorListing`, or `IndicatorParamConfig` fails `pnpm run
 * typecheck`. The assertions then compare the same list against the document,
 * so a type change that skips `backing-api.yml` fails here. Neither half alone
 * is enough — the compile-time bind needs spec files inside the typecheck
 * config, which is why they are.
 *
 * `CandlestickShape` has no TypeScript counterpart; it is wire-only, so its list
 * stays a hand-maintained regression pin.
 *
 * Nothing here compares against a running server. Structural validity is
 * `pnpm run lint:openapi`.
 */

/**
 * Bind a literal field list to an exported interface. A name that is not a key
 * fails on `K`; a key the list omits turns the expected type into a marker tuple
 * naming the absentee, so the error says which field went unrecorded.
 */
function fieldsOf<T>() {
  return <K extends readonly (keyof T & string)[]>(
    keys: [Exclude<keyof T, K[number]>] extends [never]
      ? K
      : ["contract is missing a field", Exclude<keyof T, K[number]>]
  ): readonly string[] => keys as readonly string[];
}

const BAR_FIELDS = fieldsOf<Bar>()([
  "timestamp",
  "open",
  "high",
  "low",
  "close",
  "volume"
] as const);

const LISTING_FIELDS = fieldsOf<IndicatorListing>()([
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
] as const);

const PARAM_FIELDS = fieldsOf<IndicatorParamConfig>()([
  "displayName",
  "paramName",
  "dataType",
  "defaultValue",
  "minimum",
  "maximum"
] as const);

const here = fileURLToPath(new URL(".", import.meta.url));
const spec = parse(readFileSync(`${here}backing-api.yml`, "utf8")) as OpenApiDocument;
const manifest = JSON.parse(readFileSync(`${here}package.json`, "utf8")) as {
  files: string[];
  version: string;
};

interface SchemaObject {
  required?: string[];
  properties?: Record<string, unknown>;
  enum?: string[];
}

interface OpenApiDocument {
  info: { version: string };
  paths: Record<string, Record<string, { operationId?: string }>>;
  components: { schemas: Record<string, SchemaObject> };
}

const schemas = spec.components.schemas;
const propertiesOf = (name: string): string[] => Object.keys(schemas[name].properties ?? {});

describe("backing-api.yml ships with the package", () => {
  it("declares a version for the build to replace", () => {
    // Deliberately not asserted equal to the package version. `changeset
    // version` bumps package.json and never touches this file, so that
    // assertion would fail CI on every release pull request. The shipped copy
    // is correct regardless: the build overwrites this value from package.json
    // and throws if the substitution finds nothing.
    expect(spec.info.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("lists the agent guide among the packed files", () => {
    // Does not prove the build emitted `dist/llms.txt`; that copy step is
    // unguarded.
    expect(manifest.files).toContain("llms.md");
  });
});

describe("backing-api.yml documents the operations the client calls", () => {
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

describe("schema shapes match the exported types", () => {
  it("Bar carries the OHLCV fields the client requires", () => {
    expect(schemas.Bar.required).toEqual(BAR_FIELDS);
  });

  it("IndicatorListing marks every declared property required", () => {
    // Every property of the exported interface is required, `chartConfig`
    // included — it is nullable in value, not optional in presence. Both sides
    // of this comparison come from the document, so it catches a property added
    // without a matching `required` entry, nothing more.
    expect(schemas.IndicatorListing.required).toEqual(propertiesOf("IndicatorListing"));
  });

  it("IndicatorListing declares every field the picker reads", () => {
    expect(propertiesOf("IndicatorListing")).toEqual(LISTING_FIELDS);
  });

  it("IndicatorParamConfig declares what the client sends as query parameters", () => {
    expect(propertiesOf("IndicatorParamConfig")).toEqual(PARAM_FIELDS);
  });

  it("chartType admits only the two panes the library renders", () => {
    expect(schemas.IndicatorListing.properties?.chartType).toMatchObject({
      enum: ["overlay", "oscillator"]
    });
  });

  it("CandlestickShape declares the metrics the candle description promises", () => {
    // Wire-only, so this list has no type to bind to. The description listed
    // these before the schema did, so a schema-driven consumer saw none of them.
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
