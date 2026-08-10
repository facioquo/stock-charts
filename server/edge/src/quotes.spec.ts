import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { datasetKey, toStoredBars, type StoredBar } from "./quotes";

/**
 * The same fixture `server/WebApi.Tests/Services/QuoteDatasetContractTests.cs`
 * deserializes. Asserting against it from both sides is what stops the R2
 * dataset contract from drifting: the API parses with case-sensitive options,
 * so a camelCase regression here would produce default-valued bars rather than
 * an error.
 */
const contractPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../quote-dataset.contract.json"
);

const contract = JSON.parse(readFileSync(contractPath, "utf8")) as StoredBar[];

describe("toStoredBars", () => {
  it("produces exactly the shared contract shape", () => {
    const mapped = toStoredBars([
      { t: "2026-07-31T04:00:00Z", o: 566.01, h: 568.44, l: 564.72, c: 567.19, v: 44117800 },
      { t: "2026-07-29T04:00:00Z", o: 561.23, h: 564.8, l: 559.11, c: 563.47, v: 41230100 },
      { t: "2026-07-30T04:00:00Z", o: 563.9, h: 566.12, l: 562.05, c: 565.88, v: 38904500 }
    ]);

    expect(mapped).toEqual(contract);
  });

  it("uses PascalCase keys the .NET deserializer matches case-sensitively", () => {
    const [bar] = toStoredBars([{ t: "2026-07-31T04:00:00Z", o: 1, h: 2, l: 0.5, c: 1.5, v: 100 }]);

    expect(Object.keys(bar)).toEqual(["Timestamp", "Open", "High", "Low", "Close", "Volume"]);
  });

  it("sorts ascending by timestamp regardless of feed order", () => {
    const mapped = toStoredBars([
      { t: "2026-07-31T04:00:00Z", o: 1, h: 1, l: 1, c: 1, v: 1 },
      { t: "2026-07-29T04:00:00Z", o: 1, h: 1, l: 1, c: 1, v: 1 }
    ]);

    expect(mapped.map(bar => bar.Timestamp)).toEqual([
      "2026-07-29T04:00:00Z",
      "2026-07-31T04:00:00Z"
    ]);
  });
});

describe("datasetKey", () => {
  it("matches the object name the API requests", () => {
    expect(datasetKey("QQQ")).toBe("QQQ-DAILY.json");
  });
});
