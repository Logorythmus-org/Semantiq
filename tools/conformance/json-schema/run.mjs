#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import {
  registerSchema,
  validate as hyperjumpValidate
} from "@hyperjump/json-schema/draft-2020-12";
import { BASIC } from "@hyperjump/json-schema/experimental";

const toolDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(toolDirectory, "../../..");
const vectorsPath = resolve(toolDirectory, "vectors.json");
const resultPath = resolve(toolDirectory, "results.json");
const vectors = JSON.parse(readFileSync(vectorsPath, "utf8"));
const schemaEntries = new Map(vectors.schemas.map((entry) => [entry.id, entry]));
const schemas = new Map(
  vectors.schemas.map((entry) => [
    entry.id,
    JSON.parse(readFileSync(resolve(repositoryRoot, entry.path), "utf8"))
  ])
);

if (vectors.dialect !== "https://json-schema.org/draft/2020-12/schema") {
  throw new Error(`Unsupported vector dialect: ${vectors.dialect}`);
}
if (vectors.formatPolicy !== "annotation-only") {
  throw new Error(`Unsupported format policy: ${vectors.formatPolicy}`);
}
for (const [id, schema] of schemas) {
  if (schema.$schema !== vectors.dialect) {
    throw new Error(`${schemaEntries.get(id).path}: expected explicit Draft 2020-12 declaration`);
  }
}

const normalizeCategory = (keyword) =>
  ({ required: "missing-required", type: "type-mismatch", const: "const-mismatch" })[keyword] ??
  "other-invalid";

const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: false });
const ajvResults = vectors.cases.map((testCase) => {
  const check = ajv.compile(schemas.get(testCase.schema));
  const valid = check(testCase.instance);
  return {
    case: testCase.id,
    valid,
    category: valid ? null : normalizeCategory(check.errors[0].keyword)
  };
});

const hyperjumpResults = [];
for (const [id, schema] of schemas) {
  registerSchema(schema, `https://semantiq.local/conformance/${id}`);
}
for (const testCase of vectors.cases) {
  const output = await hyperjumpValidate(
    `https://semantiq.local/conformance/${testCase.schema}`,
    testCase.instance,
    BASIC
  );
  const keyword = output.errors?.[0]?.keyword?.split("/").at(-1);
  hyperjumpResults.push({
    case: testCase.id,
    valid: output.valid,
    category: output.valid ? null : normalizeCategory(keyword)
  });
}

const pythonCommand =
  process.env.SEMANTIQ_CONFORMANCE_PYTHON ?? (process.platform === "win32" ? "python" : "python3");
let pythonResult;
try {
  pythonResult = JSON.parse(
    execFileSync(pythonCommand, [resolve(toolDirectory, "python-validator.py")], {
      cwd: repositoryRoot,
      encoding: "utf8"
    })
  );
} catch (error) {
  throw new Error(
    `python-jsonschema runner failed. Install packages/python[dev] or set ` +
      `SEMANTIQ_CONFORMANCE_PYTHON. ${error.message}`
  );
}

const validatorResults = [
  {
    validator: "ajv",
    version: "8.20.0",
    runtime: "node",
    runtimeVersion: process.versions.node,
    results: ajvResults
  },
  {
    validator: "hyperjump-json-schema",
    version: "1.17.8",
    runtime: "node",
    runtimeVersion: process.versions.node,
    results: hyperjumpResults
  },
  { ...pythonResult, runtime: "python" }
];
const failures = [];
for (const validator of validatorResults) {
  for (const result of validator.results) {
    const expected = vectors.cases.find((testCase) => testCase.id === result.case);
    if (result.valid !== expected.expectedValid || result.category !== expected.expectedCategory) {
      failures.push(
        `${validator.validator}@${validator.version} ${result.case}: ` +
          `got ${result.valid}/${result.category}, expected ` +
          `${expected.expectedValid}/${expected.expectedCategory}`
      );
    }
  }
}

const matrix = {
  version: "0.1",
  dialect: vectors.dialect,
  formatPolicy: vectors.formatPolicy,
  schemaCount: vectors.schemas.length,
  caseCount: vectors.cases.length,
  validators: validatorResults
};
writeFileSync(resultPath, `${JSON.stringify(matrix, null, 2)}\n`);

if (failures.length > 0) {
  console.error("JSON Schema conformance failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(
  `JSON Schema conformance passed: ${vectors.schemas.length} schemas, ` +
    `${vectors.cases.length} cases, ${validatorResults.length} validators, ` +
    `${validatorResults.reduce((total, validator) => total + validator.results.length, 0)} assertions.`
);
