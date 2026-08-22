import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  formatApaCitation,
  formatBibtexCitation,
  type CitationMetadata
} from "../../packages/semantiq/src/citation.js";

describe("Citation & DOI Infrastructure (Prompt 6.17)", () => {
  it("verifies CITATION.cff, codemeta.json, and .zenodo.json schema files exist", () => {
    expect(existsSync("CITATION.cff")).toBe(true);
    expect(existsSync("codemeta.json")).toBe(true);
    expect(existsSync(".zenodo.json")).toBe(true);
    expect(existsSync("Docs/CITATION_GUIDE.md")).toBe(true);
    expect(existsSync("Docs/ZENODO_DOI_WORKFLOW.md")).toBe(true);
    expect(existsSync("Docs/VERSION_DOI_VS_CONCEPT_DOI.md")).toBe(true);
    expect(existsSync("Docs/AUTHOR_AND_CONTRIBUTOR_IDENTIFIERS.md")).toBe(true);
    expect(existsSync("Docs/DOI_PUBLICATION_CHECKLIST.md")).toBe(true);
  });

  it("verifies cross-file version consistency", () => {
    const cffContent = readFileSync("CITATION.cff", "utf-8");
    const codemeta = JSON.parse(readFileSync("codemeta.json", "utf-8")) as { version: string };

    expect(cffContent).toMatch(/version:\s*"0\.1\.0-alpha\.2"/);
    expect(codemeta.version).toBe("0.1.0-alpha.2");
  });

  it("formats BibTeX and APA citations accurately", () => {
    const meta: CitationMetadata = {
      cffVersion: "1.2.0",
      title: "SemantIQ Benchmarks: Local-First AI Evaluation Toolkit",
      version: "0.1.0-alpha.1",
      dateReleased: "2026-07-31",
      repositoryCode: "https://github.com/Logorythmus-org/Semantiq",
      license: "MIT",
      authors: [{ name: "Tech Club Foundation" }]
    };

    const bibtex = formatBibtexCitation(meta);
    expect(bibtex).toContain("@software{semantiq_benchmarks_2026");
    expect(bibtex).toContain(
      "title        = {SemantIQ Benchmarks: Local-First AI Evaluation Toolkit}"
    );

    const apa = formatApaCitation(meta);
    expect(apa).toContain("(2026)");
    expect(apa).toContain("Version 0.1.0-alpha.1");
  });
});
