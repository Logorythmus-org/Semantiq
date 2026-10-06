import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cp, mkdtemp, rm, writeFile, readFile, appendFile, symlink, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { readFileSync } from "node:fs";
import {
  loadBenchmarkPack,
  validateBenchmarkPackManifest,
  canonicalBenchmarkPackManifest,
  benchmarkPackDigest,
  BenchmarkRegistry,
  MetricRegistry,
  EvaluatorRegistry,
  CANONICAL_BENCHMARK_REGISTRY,
  CANONICAL_METRIC_REGISTRY,
  CANONICAL_EVALUATOR_REGISTRY,
  type BenchmarkPackManifest
} from "../../packages/benchmark/src/index.js";
import { canonicalJson, computeSha256 } from "../../packages/sandbox-contracts/src/index.js";

const example = path.resolve("fixtures/benchmark-packs/long-horizon-synthetic-0.1.0");
const manifest = JSON.parse(
  readFileSync(path.join(example, "manifest.json"), "utf8")
) as BenchmarkPackManifest;
function change(input: unknown, keys: readonly string[], value: unknown): void {
  let target = input as Record<string, unknown>;
  for (const key of keys.slice(0, -1)) target = target[key] as Record<string, unknown>;
  target[keys.at(-1)!] = value;
}
const negatives: [string, string[], unknown, string][] = [
  ["missing metric for numeric evaluator", ["metrics"], [], "METRIC_BINDING_REQUIRED"],
  ["blank license", ["rights", "license", "identifier"], "   ", "SCHEMA_INVALID"],
  [
    "unknown benchmark",
    ["benchmark", "benchmarkId"],
    "not_registered",
    "UNKNOWN_BENCHMARK_IDENTITY"
  ],
  [
    "wrong benchmark version",
    ["benchmark", "benchmarkVersion"],
    "9.0.0",
    "UNKNOWN_BENCHMARK_IDENTITY"
  ],
  ["legacy alias", ["benchmark", "benchmarkId"], "bmk_hacs_evaluation_v1", "ALIAS_FORBIDDEN"],
  ["ambiguous HACS name", ["benchmark", "benchmarkId"], "HACS", "SCHEMA_INVALID"],
  [
    "unknown evaluator",
    ["evaluator", "evaluatorId"],
    "not_registered",
    "UNKNOWN_EVALUATOR_IDENTITY"
  ],
  [
    "wrong evaluator version",
    ["evaluator", "evaluatorVersion"],
    "9.0.0",
    "UNKNOWN_EVALUATOR_IDENTITY"
  ],
  [
    "incompatible evaluator",
    ["evaluator", "evaluatorId"],
    "sandbox_tck_suite",
    "EVALUATOR_BENCHMARK_MISMATCH"
  ],
  ["unknown metric", ["metrics", "0", "metricId"], "not_registered", "UNKNOWN_METRIC_IDENTITY"],
  ["wrong metric version", ["metrics", "0", "metricVersion"], "9.0.0", "UNKNOWN_METRIC_IDENTITY"],
  [
    "different metric benchmark/construct",
    ["metrics", "0", "metricId"],
    "provider_tck_pass_rate",
    "METRIC_BENCHMARK_MISMATCH"
  ],
  ["prohibited rights", ["rights", "rightsClass"], "PROHIBITED", "BUNDLED_RIGHTS_NOT_CLEARED"],
  ["unknown rights", ["rights", "rightsClass"], "UNKNOWN_RIGHTS", "BUNDLED_RIGHTS_NOT_CLEARED"],
  [
    "reference-only bundled material",
    ["rights", "rightsClass"],
    "PUBLIC_REFERENCE_ONLY",
    "BUNDLED_RIGHTS_NOT_CLEARED"
  ],
  ["missing license", ["rights", "license"], undefined, "LICENSE_DECLARATION_REQUIRED"],
  ["missing provenance", ["provenance"], undefined, "SCHEMA_INVALID"],
  ["missing provenance sources", ["provenance", "sourceReferences"], [], "SCHEMA_INVALID"],
  ["malformed SemVer", ["identity", "packVersion"], "01.0.0", "SCHEMA_INVALID"],
  ["invalid prerelease SemVer", ["identity", "packVersion"], "1.0.0-01", "SCHEMA_INVALID"],
  ["unsupported schema", ["schemaVersion"], "9.0.0", "SCHEMA_INVALID"],
  ["authority elevation", ["scientificAuthority"], "VALIDATED", "SCHEMA_INVALID"],
  ["BM self-promotion", ["bmLevel"], "BM5", "SCHEMA_INVALID"],
  ["M self-promotion", ["maturityLevel"], "M6", "SCHEMA_INVALID"],
  ["governance self-approval", ["governanceApproved"], true, "SCHEMA_INVALID"],
  ["nested maturity field", ["provenance", "bmLevel"], "BM3", "SCHEMA_INVALID"],
  ["audit authority field", ["auditMetadata"], { bmLevel: "BM4" }, "SCHEMA_INVALID"],
  ["absolute POSIX path", ["cases", "0", "path"], "/etc/passwd", "SCHEMA_INVALID"],
  ["absolute Windows path", ["cases", "0", "path"], "C:/private/file.json", "SCHEMA_INVALID"],
  ["UNC path", ["cases", "0", "path"], "\\\\host\\share\\file", "SCHEMA_INVALID"],
  ["parent traversal", ["cases", "0", "path"], "../case.json", "SCHEMA_INVALID"],
  ["nested traversal", ["cases", "0", "path"], "sub/../../case.json", "SCHEMA_INVALID"],
  ["empty path", ["cases", "0", "path"], "", "SCHEMA_INVALID"],
  ["network reference", ["cases", "0", "path"], "https://example.com/case.json", "SCHEMA_INVALID"],
  ["digest mismatch", ["cases", "0", "digest", "value"], "0".repeat(64), "FIXTURE_DIGEST_MISMATCH"],
  [
    "non-byte digest representation",
    ["cases", "0", "digest", "representation"],
    "CANONICAL_JSON",
    "SCHEMA_INVALID"
  ],
  ["missing fixture", ["cases", "0", "path"], "missing.json", "FIXTURE_LOAD_FAILED"],
  ["Windows reserved file", ["cases", "0", "path"], "CON.json", "FIXTURE_LOAD_FAILED"],
  ["alternate data stream", ["cases", "0", "path"], "case.json:secret", "SCHEMA_INVALID"],
  [
    "exposure identity mismatch",
    ["exposure", "benchmarkId"],
    "other",
    "EXPOSURE_IDENTITY_MISMATCH"
  ],
  ["exposure version mismatch", ["exposure", "version"], "9.0.0", "EXPOSURE_IDENTITY_MISMATCH"],
  [
    "protected export",
    ["exposure", "exposureTier"],
    "tier_d_protected_challenge",
    "PROTECTED_EXPOSURE_EXPORT"
  ],
  [
    "rotation without schedule",
    ["exposure", "exposureTier"],
    "tier_b_rotating",
    "ROTATION_SCHEDULE_REQUIRED"
  ],
  [
    "unknown evaluator parameter",
    ["executionRequirements", "parameters"],
    { undeclared_parameter: "value" },
    "UNKNOWN_PARAMETER"
  ],
  [
    "wrong evaluator input",
    ["executionRequirements", "inputKind"],
    "OTHER",
    "EVALUATOR_INPUT_MISMATCH"
  ]
];
let parent: string;
let root: string;
beforeEach(async () => {
  parent = await mkdtemp(path.join(tmpdir(), "semantiq-pack-contract-"));
  root = path.join(parent, "pack");
  await cp(example, root, { recursive: true });
});
afterEach(async () => {
  await rm(parent, { recursive: true, force: true });
});
async function save(input: unknown) {
  await writeFile(path.join(root, "manifest.json"), JSON.stringify(input));
}

describe("governed benchmark pack contract", () => {
  it("loads exactly one synthetic pack with exact existing bindings and verified bytes", async () => {
    const result = await loadBenchmarkPack(root);
    expect(result.validation.valid).toBe(true);
    expect(result.admission).toEqual({
      status: "ADMISSIBLE",
      violations: [],
      scientificAuthority: "NONE"
    });
    expect(result.manifest).toEqual(manifest);
    expect(result.verifiedCases).toEqual([
      { caseId: "synthetic_step", digest: manifest.cases[0]!.digest }
    ]);
    expect(result.verifiedCases[0]!.digest.value).toBe(
      computeSha256(await readFile(path.join(root, "case.json")))
    );
    expect(result.packDigest).toEqual(benchmarkPackDigest(manifest));
    expect(await loadBenchmarkPack(root)).toEqual(result);
  });
  it.each(negatives)("fails closed: %s", async (_label, keys, value, code) => {
    const input = structuredClone(manifest);
    change(input, keys, value);
    await save(input);
    const result = await loadBenchmarkPack(root);
    expect(result.admission.status).toBe("BLOCKED");
    expect(result.admission.violations.map((item) => item.code)).toContain(code);
    expect(result.packDigest).toBeUndefined();
  });
  it("never mutates registries or maps internal M-levels to public BM-levels", async () => {
    const benchmarks = new BenchmarkRegistry(structuredClone(CANONICAL_BENCHMARK_REGISTRY));
    const metrics = new MetricRegistry(structuredClone(CANONICAL_METRIC_REGISTRY), benchmarks);
    const evaluators = new EvaluatorRegistry(
      structuredClone(CANONICAL_EVALUATOR_REGISTRY),
      benchmarks,
      metrics
    );
    const before = canonicalJson({
      benchmarks: benchmarks.snapshot,
      metrics: metrics.snapshot,
      evaluators: evaluators.snapshot
    });
    const maturity = benchmarks.deriveMaturity(manifest.benchmark);
    const lifecycle = readFileSync("Docs/benchmarks/BENCHMARK_LIFECYCLE.md", "utf8");
    const result = await loadBenchmarkPack(root, { benchmarks, metrics, evaluators });
    expect(
      canonicalJson({
        benchmarks: benchmarks.snapshot,
        metrics: metrics.snapshot,
        evaluators: evaluators.snapshot
      })
    ).toBe(before);
    expect(benchmarks.deriveMaturity(manifest.benchmark)).toBe(maturity);
    expect(benchmarks.get(manifest.benchmark)?.scientificMaturity).toBe("UNVALIDATED_PROXY");
    expect(readFileSync("Docs/benchmarks/BENCHMARK_LIFECYCLE.md", "utf8")).toBe(lifecycle);
    expect(Object.keys(result)).not.toContain("bmLevel");
    expect(Object.keys(result.admission)).not.toContain("maturityLevel");
    expect(result).not.toHaveProperty("promotion");
  });
  it("keeps audit timestamps/comments out of canonical identity", () => {
    const other = {
      ...manifest,
      auditMetadata: { recordedAt: "different-local-time", reviewerComments: ["comment"] }
    };
    expect(benchmarkPackDigest(other)).toEqual(benchmarkPackDigest(manifest));
    expect(canonicalBenchmarkPackManifest(other)).not.toContain("recordedAt");
    const reversed = Object.fromEntries(Object.entries(manifest).reverse());
    expect(canonicalBenchmarkPackManifest(reversed)).toBe(canonicalBenchmarkPackManifest(manifest));
    expect(benchmarkPackDigest(reversed)).toEqual(benchmarkPackDigest(manifest));
  });
  it.each([
    ["identity", "packVersion"],
    ["benchmark", "benchmarkVersion"],
    ["evaluator", "evaluatorVersion"],
    ["metrics", "0", "metricVersion"],
    ["cases", "0", "caseId"],
    ["cases", "0", "digest", "value"],
    ["provenance", "origin"],
    ["rights", "rightsClass"],
    ["rights", "license", "reference"],
    ["executionRequirements", "inputKind"],
    ["limitations", "0"],
    ["intendedUse"]
  ])("binds material field %j", (...keys) => {
    const input = structuredClone(manifest);
    let value: unknown = "changed";
    if (keys.at(-1) === "value") value = "0".repeat(64);
    if (keys.at(-1)?.includes("Version")) value = "0.2.0";
    if (keys.at(-1) === "rightsClass") value = "OPEN_CLEARED";
    change(input, keys, value);
    expect(benchmarkPackDigest(input)).not.toEqual(benchmarkPackDigest(manifest));
  });
  it("detects fixture tampering and binds an updated fixture digest into pack identity", async () => {
    await appendFile(path.join(root, "case.json"), " ");
    expect((await loadBenchmarkPack(root)).admission.violations.map((item) => item.code)).toContain(
      "FIXTURE_DIGEST_MISMATCH"
    );
    const input = structuredClone(manifest);
    change(
      input,
      ["cases", "0", "digest", "value"],
      computeSha256(await readFile(path.join(root, "case.json")))
    );
    await save(input);
    const result = await loadBenchmarkPack(root);
    expect(result.admission.status).toBe("ADMISSIBLE");
    expect(result.packDigest).not.toEqual(benchmarkPackDigest(manifest));
  });
  it.each(["caseId", "path"])("rejects duplicate logical case %s", async (key) => {
    const second = { ...manifest.cases[0]!, caseId: "other", path: "other.json" };
    if (key === "caseId") second.caseId = manifest.cases[0]!.caseId;
    else second.path = manifest.cases[0]!.path;
    const input = { ...manifest, cases: [...manifest.cases, second] };
    expect(validateBenchmarkPackManifest(input).violations.map((item) => item.code)).toContain(
      "DUPLICATE_LOGICAL_IDENTITY"
    );
  });
  it("rejects duplicate metric identities across versions", () => {
    expect(
      validateBenchmarkPackManifest({
        ...manifest,
        metrics: [...manifest.metrics, { ...manifest.metrics[0]!, metricVersion: "0.2.0" }]
      }).valid
    ).toBe(false);
  });
  it("requires review for restricted rights and never turns that into scientific authority", async () => {
    await save({
      ...manifest,
      rights: { ...manifest.rights, rightsClass: "RESTRICTED_REVIEW_REQUIRED" }
    });
    const result = await loadBenchmarkPack(root);
    expect(result.validation.valid).toBe(true);
    expect(result.admission.status).toBe("REVIEW_REQUIRED");
    expect(result.admission.scientificAuthority).toBe("NONE");
  });
  it("rejects symlinked fixtures, intermediate directories and pack roots", async () => {
    const external = path.join(parent, "outside");
    await mkdir(external);
    await writeFile(path.join(external, "case.json"), await readFile(path.join(root, "case.json")));
    await symlink(
      external,
      path.join(root, "linked"),
      process.platform === "win32" ? "junction" : "dir"
    );
    await save({ ...manifest, cases: [{ ...manifest.cases[0]!, path: "linked/case.json" }] });
    expect((await loadBenchmarkPack(root)).admission.status).toBe("BLOCKED");
    const linkedRoot = path.join(parent, "linked-root");
    await symlink(root, linkedRoot, process.platform === "win32" ? "junction" : "dir");
    expect((await loadBenchmarkPack(linkedRoot)).validation.valid).toBe(false);
  });
  it("rejects malformed manifests and non-JSON data without invoking getters", async () => {
    await writeFile(path.join(root, "manifest.json"), "{");
    expect((await loadBenchmarkPack(root)).validation.valid).toBe(false);
    let invoked = false;
    const input = {
      ...manifest,
      get undeclared() {
        invoked = true;
        return "unsafe";
      }
    };
    expect(validateBenchmarkPackManifest(input).valid).toBe(false);
    expect(invoked).toBe(false);
    expect(
      validateBenchmarkPackManifest({
        ...manifest,
        executionRequirements: { ...manifest.executionRequirements, parameters: { x: NaN } }
      }).valid
    ).toBe(false);
  });
});
