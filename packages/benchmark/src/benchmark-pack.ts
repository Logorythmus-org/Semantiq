import { readFileSync } from "node:fs";
import { lstat, realpath, readFile } from "node:fs/promises";
import path from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import { canonicalJson, computeSha256 } from "../../sandbox-contracts/src/index.js";
import { BenchmarkRegistry, benchmarkIdentityKey } from "./registry.js";
import { MetricRegistry, metricIdentityKey } from "./metrics.js";
import { EvaluatorRegistry, EvaluatorConfigurationValidationError } from "./evaluators.js";
import { CANONICAL_BENCHMARK_REGISTRY } from "./registry-definitions.js";
import { CANONICAL_METRIC_REGISTRY } from "./metric-definitions.js";
import { CANONICAL_EVALUATOR_REGISTRY } from "./evaluator-definitions.js";
import type { SemanticDigest } from "./evidence-types.js";
import type { BenchmarkRegistryViolation } from "./registry-types.js";
import type {
  BenchmarkPackManifest,
  BenchmarkPackRegistries,
  BenchmarkPackValidationResult,
  BenchmarkPackLoadResult
} from "./benchmark-pack-types.js";

const schema = JSON.parse(
  readFileSync(
    new URL("../../../schemas/benchmark-pack-manifest.schema.json", import.meta.url),
    "utf8"
  )
);
const check = new Ajv2020({
  allErrors: true,
  strict: true,
  validateFormats: false
}).compile<BenchmarkPackManifest>(schema);
const violation = (
  code: string,
  location: string,
  message: string
): BenchmarkRegistryViolation => ({ code, path: location, message });

// Reject non-JSON values without invoking contributor getters or silently losing fields.
function isJson(value: unknown, ancestors = new Set<object>()): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object" || ancestors.has(value)) return false;
  if (
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null
  )
    return false;
  ancestors.add(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(descriptors).filter(
    (key) => !(Array.isArray(value) && key === "length")
  );
  const valid =
    (!Array.isArray(value) || keys.length === value.length) &&
    keys.every((key) => {
      const descriptor = typeof key === "string" ? descriptors[key] : undefined;
      return (
        descriptor?.enumerable === true &&
        "value" in descriptor &&
        isJson(descriptor.value, ancestors)
      );
    });
  ancestors.delete(value);
  return valid;
}
export function validateBenchmarkPackManifest(input: unknown): BenchmarkPackValidationResult {
  if (!isJson(input))
    return {
      valid: false,
      violations: [
        violation("NON_JSON_MANIFEST", "manifest", "Manifest must be plain finite JSON data.")
      ]
    };
  if (!check(input))
    return {
      valid: false,
      violations: (check.errors ?? []).map((error) =>
        violation("SCHEMA_INVALID", error.instancePath || "manifest", error.keyword)
      )
    };
  const violations: BenchmarkRegistryViolation[] = [];
  for (const [location, keys] of [
    ["cases.caseId", input.cases.map((item) => item.caseId)],
    ["cases.path", input.cases.map((item) => item.path.toLowerCase())],
    ["metrics", input.metrics.map((item) => item.metricId)]
  ] as const) {
    if (new Set(keys).size !== keys.length)
      violations.push(
        violation("DUPLICATE_LOGICAL_IDENTITY", location, "Logical identities must be unique.")
      );
  }
  return { valid: violations.length === 0, violations };
}
/** Validity here is structural, not fixture integrity, admission or scientific validity. */
export function canonicalBenchmarkPackManifest(input: unknown): string {
  const validation = validateBenchmarkPackManifest(input);
  if (!validation.valid) throw new Error("Invalid benchmark pack manifest.");
  const material = { ...(input as BenchmarkPackManifest) };
  delete material.auditMetadata;
  return canonicalJson(material);
}
export function benchmarkPackDigest(input: unknown): SemanticDigest {
  return {
    algorithm: "SHA_256",
    canonicalizationProfile: "semantiq-canonical-json-v1",
    value: computeSha256(canonicalBenchmarkPackManifest(input))
  };
}
function defaultRegistries(): BenchmarkPackRegistries {
  const benchmarks = new BenchmarkRegistry(CANONICAL_BENCHMARK_REGISTRY);
  const metrics = new MetricRegistry(CANONICAL_METRIC_REGISTRY, benchmarks);
  return {
    benchmarks,
    metrics,
    evaluators: new EvaluatorRegistry(CANONICAL_EVALUATOR_REGISTRY, benchmarks, metrics)
  };
}
function bindingAssessment(manifest: BenchmarkPackManifest, registries: BenchmarkPackRegistries) {
  const violations: BenchmarkRegistryViolation[] = [];
  const add = (code: string, location: string) =>
    violations.push(violation(code, location, "Declared pack relationship is not admissible."));
  const benchmark = registries.benchmarks.get(manifest.benchmark);
  if (!benchmark)
    add(
      registries.benchmarks.resolveAlias(manifest.benchmark.benchmarkId).length
        ? "ALIAS_FORBIDDEN"
        : "UNKNOWN_BENCHMARK_IDENTITY",
      "benchmark"
    );
  const evaluator = registries.evaluators.get(manifest.evaluator);
  if (!evaluator) add("UNKNOWN_EVALUATOR_IDENTITY", "evaluator");
  const binding = evaluator?.benchmarkBindings.find(
    (item) => benchmarkIdentityKey(item.benchmark) === benchmarkIdentityKey(manifest.benchmark)
  );
  if (evaluator) {
    if (!binding || evaluator.bindingStatus !== "IMPLEMENTED_AND_BOUND")
      add("EVALUATOR_BENCHMARK_MISMATCH", "evaluator");
    if (
      !evaluator.inputs.inputKinds.includes(manifest.executionRequirements.inputKind) ||
      !evaluator.inputs.subjectKinds.includes(manifest.executionRequirements.subjectKind)
    )
      add("EVALUATOR_INPUT_MISMATCH", "executionRequirements");
    try {
      registries.evaluators.createConfiguration({
        evaluatorIdentity: manifest.evaluator,
        parameters: manifest.executionRequirements.parameters,
        ...(evaluator.rubric.identity ? { rubricIdentity: evaluator.rubric.identity } : {})
      });
    } catch (error) {
      if (error instanceof EvaluatorConfigurationValidationError)
        violations.push(...error.violations);
      else add("EVALUATOR_CONFIGURATION_INVALID", "executionRequirements.parameters");
    }
  }
  if (evaluator?.outputs.kinds.includes("METRIC_RESULT") && manifest.metrics.length === 0)
    add("METRIC_BINDING_REQUIRED", "metrics");
  for (const identity of manifest.metrics) {
    const metric = registries.metrics.get(identity);
    if (!metric) {
      add("UNKNOWN_METRIC_IDENTITY", "metrics");
      continue;
    }
    if (
      !evaluator?.metricBindings.some(
        (candidate) => metricIdentityKey(candidate) === metricIdentityKey(identity)
      ) ||
      metric.evaluator.evaluatorId !== evaluator?.implementationId
    )
      add("METRIC_EVALUATOR_MISMATCH", "metrics");
    if (
      metric.scope === "BENCHMARK_BOUND" &&
      (!metric.benchmarkBinding ||
        benchmarkIdentityKey(metric.benchmarkBinding.benchmark) !==
          benchmarkIdentityKey(manifest.benchmark) ||
        !benchmark?.constructIds.includes(metric.benchmarkBinding.constructId) ||
        !binding?.constructIds.includes(metric.benchmarkBinding.constructId))
    )
      add("METRIC_BENCHMARK_MISMATCH", "metrics");
  }
  if (
    manifest.exposure.benchmarkId !== manifest.benchmark.benchmarkId ||
    manifest.exposure.version !== manifest.benchmark.benchmarkVersion
  )
    add("EXPOSURE_IDENTITY_MISMATCH", "exposure");
  if (
    manifest.exposure.exposureTier === "tier_d_protected_challenge" &&
    manifest.exposure.isPublicBundleExportable
  )
    add("PROTECTED_EXPOSURE_EXPORT", "exposure");
  if (
    manifest.exposure.exposureTier === "tier_b_rotating" &&
    !manifest.exposure.rotationScheduleDays
  )
    add("ROTATION_SCHEDULE_REQUIRED", "exposure");
  const rights = manifest.rights.rightsClass;
  if (["PROHIBITED", "UNKNOWN_RIGHTS", "PUBLIC_REFERENCE_ONLY"].includes(rights))
    add("BUNDLED_RIGHTS_NOT_CLEARED", "rights");
  if (!manifest.rights.license) add("LICENSE_DECLARATION_REQUIRED", "rights.license");
  return { violations, reviewRequired: rights === "RESTRICTED_REVIEW_REQUIRED" };
}
const portablePath = /^[A-Za-z0-9_-][A-Za-z0-9_.-]*(?:\/[A-Za-z0-9_-][A-Za-z0-9_.-]*)*$/;
async function readPackFile(root: string, reference: string, limit: number): Promise<Buffer> {
  if (
    !portablePath.test(reference) ||
    reference
      .split("/")
      .some(
        (part) => /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part) || /[.]$/.test(part)
      )
  )
    throw new Error("UNSAFE_PATH");
  let current = root;
  for (const part of reference.split("/")) {
    current = path.join(current, part);
    const stat = await lstat(current);
    if (stat.isSymbolicLink()) throw new Error("SYMLINK_FORBIDDEN");
  }
  const resolved = await realpath(current);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("UNSAFE_PATH");
  const stat = await lstat(resolved);
  if (!stat.isFile()) throw new Error("REGULAR_FILE_REQUIRED");
  if (stat.size > limit) throw new Error("FILE_TOO_LARGE");
  const content = await readFile(resolved);
  if (content.length > limit) throw new Error("FILE_TOO_LARGE");
  return content;
}
/** Read-only local validation. Caller must supply a stable tree, not concurrent hostile writers. */
export async function loadBenchmarkPack(
  packRoot: string,
  registries: BenchmarkPackRegistries = defaultRegistries()
): Promise<BenchmarkPackLoadResult> {
  let input: unknown;
  let root: string;
  try {
    if ((await lstat(packRoot)).isSymbolicLink()) throw new Error("SYMLINK_FORBIDDEN");
    root = await realpath(packRoot);
    input = JSON.parse((await readPackFile(root, "manifest.json", 1024 * 1024)).toString("utf8"));
  } catch {
    const violations = [
      violation(
        "MANIFEST_LOAD_FAILED",
        "manifest.json",
        "A regular local JSON manifest within a stable pack root is required."
      )
    ];
    return {
      validation: { valid: false, violations },
      admission: { status: "BLOCKED", violations, scientificAuthority: "NONE" },
      verifiedCases: []
    };
  }
  const validation = validateBenchmarkPackManifest(input);
  if (!validation.valid)
    return {
      validation,
      admission: {
        status: "BLOCKED",
        violations: validation.violations,
        scientificAuthority: "NONE"
      },
      verifiedCases: []
    };
  const manifest = input as BenchmarkPackManifest;
  const assessment = bindingAssessment(manifest, registries);
  const violations = [...assessment.violations];
  const verifiedCases: BenchmarkPackLoadResult["verifiedCases"][number][] = [];
  for (const item of manifest.cases) {
    try {
      const bytes = await readPackFile(root, item.path, 8 * 1024 * 1024);
      if (computeSha256(bytes) !== item.digest.value)
        violations.push(
          violation(
            "FIXTURE_DIGEST_MISMATCH",
            `cases.${item.caseId}`,
            "Fixture bytes do not match the declared digest."
          )
        );
      else verifiedCases.push({ caseId: item.caseId, digest: item.digest });
    } catch {
      violations.push(
        violation(
          "FIXTURE_LOAD_FAILED",
          `cases.${item.caseId}`,
          "A bounded regular local fixture within the pack root is required."
        )
      );
    }
  }
  return {
    validation,
    admission: {
      status: violations.length
        ? "BLOCKED"
        : assessment.reviewRequired
          ? "REVIEW_REQUIRED"
          : "ADMISSIBLE",
      violations,
      scientificAuthority: "NONE"
    },
    manifest,
    ...(violations.length ? {} : { packDigest: benchmarkPackDigest(manifest) }),
    verifiedCases
  };
}
