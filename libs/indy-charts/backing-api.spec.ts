import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { parse } from "yaml";
import { describe, expect, it } from "vitest";

/**
 * Pins the published contract against the things that can silently stop
 * matching it: the package manifest, and the document's own internal
 * consistency.
 *
 * What this does NOT cover, deliberately and worth knowing before trusting it:
 * the exported TypeScript types. Nothing here imports `./config`, so renaming a
 * field on `Bar` or `IndicatorListing` leaves every test below green. Types are
 * erased at runtime, and a compile-time check would need spec files to be
 * typechecked, which they are not — `tsconfig.json` excludes them and `eslint`
 * does not surface type errors. The literal field lists are therefore a
 * regression pin maintained by hand, not a derivation.
 *
 * Nor does anything compare against a running server. Structural validity is
 * `pnpm run lint:openapi`.
 */

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

describe("schema shapes are pinned against accidental edits", () => {
  // Literal rather than derived. These catch a careless edit to the document;
  // they cannot catch the TypeScript type moving underneath it.
  it("Bar carries the OHLCV fields the client requires", () => {
    expect(schemas.Bar.required).toEqual(["timestamp", "open", "high", "low", "close", "volume"]);
  });

  it("IndicatorListing marks every declared property required", () => {
    // Every property of the exported interface is required, `chartConfig`
    // included — it is nullable in value, not optional in presence. Both sides
    // of this comparison come from the document, so it catches a property added
    // without a matching `required` entry, nothing more.
    expect(schemas.IndicatorListing.required).toEqual(propertiesOf("IndicatorListing"));
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
