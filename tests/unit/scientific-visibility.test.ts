import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  formatDataciteMetadata,
  formatOpenAlexMetadata
} from "../../packages/semantiq/src/index.js";

describe("Prompt 7.5 — Scientific Visibility & Citation Verification", () => {
  it("formats DataCite v4.4 metadata JSON structures", () => {
    const meta = formatDataciteMetadata("10.5281/zenodo.12345", "SemantIQ Benchmarks", 2026);
    expect(meta.identifier.identifier).toEqual("10.5281/zenodo.12345");
    expect(meta.schemaVersion).toEqual("http://datacite.org/schema/kernel-4");
  });

  it("formats OpenAlex software entity metadata", () => {
    const meta = formatOpenAlexMetadata("10.5281/zenodo.12345", "SemantIQ Benchmarks", 2026);
    expect(meta["type"]).toEqual("software");
    expect(meta["doi"]).toContain("10.5281/zenodo.12345");
  });

  it("verifies DataCite sample file on disk", () => {
    expect(existsSync("examples/citation/datacite.json")).toBe(true);
    expect(existsSync("Docs/SCIENTIFIC_VISIBILITY.md")).toBe(true);
    expect(existsSync("Docs/PREPRINT_PREPARATION.md")).toBe(true);
    expect(existsSync("Docs/SCIENTIFIC_VISIBILITY_REPORT.md")).toBe(true);

    const jsonStr = readFileSync("examples/citation/datacite.json", "utf-8");
    const json = JSON.parse(jsonStr) as { schemaVersion: string };
    expect(json.schemaVersion).toContain("kernel-4");
  });
});
