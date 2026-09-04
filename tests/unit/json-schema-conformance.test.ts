import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const vectorsPath = "tools/conformance/json-schema/vectors.json";
const resultsPath = "tools/conformance/json-schema/results.json";
const vectors = JSON.parse(readFileSync(vectorsPath, "utf8")) as {
  dialect: string;
  formatPolicy: string;
  schemas: Array<{ id: string; path: string }>;
  cases: Array<{
    id: string;
    schema: string;
    expectedValid: boolean;
    expectedCategory: string | null;
  }>;
};
const matrix = JSON.parse(readFileSync(resultsPath, "utf8")) as {
  dialect: string;
  formatPolicy: string;
  schemaCount: number;
  caseCount: number;
  validators: Array<{
    validator: string;
    version: string;
    runtime: string;
    runtimeVersion: string;
    results: Array<{ case: string; valid: boolean; category: string | null }>;
  }>;
};

describe("JSON Schema multi-validator conformance evidence", () => {
  it("uses explicit Draft 2020-12 schemas and one shared vector pack", () => {
    expect(vectors.dialect).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(vectors.formatPolicy).toBe("annotation-only");
    expect(vectors.schemas).toHaveLength(3);
    expect(vectors.cases).toHaveLength(12);

    const schemaIds = new Set(vectors.schemas.map(({ id }) => id));
    for (const entry of vectors.schemas) {
      const schema = JSON.parse(readFileSync(entry.path, "utf8")) as { $schema?: string };
      expect(schema.$schema, entry.path).toBe(vectors.dialect);
    }
    for (const testCase of vectors.cases) {
      expect(schemaIds.has(testCase.schema), testCase.id).toBe(true);
    }
  });

  it("pins three independent implementations across two runtimes", () => {
    expect(
      matrix.validators.map(({ validator, version, runtime }) => ({
        validator,
        version,
        runtime
      }))
    ).toEqual([
      { validator: "ajv", version: "8.20.0", runtime: "node" },
      { validator: "hyperjump-json-schema", version: "1.17.8", runtime: "node" },
      { validator: "python-jsonschema", version: "4.26.0", runtime: "python" }
    ]);
    for (const validator of matrix.validators) {
      expect(validator.runtimeVersion).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  it("records complete agreement for positive and meaningful negative cases", () => {
    expect(matrix.schemaCount).toBe(vectors.schemas.length);
    expect(matrix.caseCount).toBe(vectors.cases.length);
    expect(matrix.dialect).toBe(vectors.dialect);
    expect(matrix.formatPolicy).toBe(vectors.formatPolicy);

    const expected = new Map(
      vectors.cases.map((testCase) => [
        testCase.id,
        { valid: testCase.expectedValid, category: testCase.expectedCategory }
      ])
    );
    for (const validator of matrix.validators) {
      expect(validator.results).toHaveLength(vectors.cases.length);
      for (const result of validator.results) {
        expect(result, `${validator.validator}: ${result.case}`).toMatchObject(
          expected.get(result.case)!
        );
      }
    }

    expect(vectors.cases.filter(({ expectedValid }) => expectedValid)).toHaveLength(6);
    expect(vectors.cases.filter(({ expectedValid }) => !expectedValid)).toHaveLength(6);
    expect(new Set(vectors.cases.map(({ expectedCategory }) => expectedCategory))).toEqual(
      new Set([null, "missing-required", "type-mismatch", "const-mismatch"])
    );
  });

  it("keeps the report linked and the CI gate executable", () => {
    const evidenceIndex = readFileSync("Docs/evidence/README.md", "utf8");
    const documentationIndex = readFileSync("Docs/DOCUMENTATION_INDEX.md", "utf8");
    const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
    const runner = readFileSync("tools/conformance/json-schema/run.mjs", "utf8");
    const pythonRequirements = readFileSync(
      "tools/conformance/json-schema/requirements.txt",
      "utf8"
    );

    expect(evidenceIndex).toContain("JSON_SCHEMA_CONFORMANCE.md");
    expect(documentationIndex).toContain("evidence/JSON_SCHEMA_CONFORMANCE.md");
    expect(workflow).toContain("pnpm conformance:json-schema");
    expect(workflow).toContain("tools/conformance/json-schema/requirements.txt");
    expect(pythonRequirements.trim()).toBe("jsonschema==4.26.0");
    expect(runner).toContain("normalizeCategory(keyword)");
    expect(runner).not.toContain("category: output.valid ? null : testCase.expectedCategory");
  });
});
