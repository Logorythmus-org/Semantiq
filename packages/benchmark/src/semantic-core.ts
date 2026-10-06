import { readFileSync } from "node:fs";
import { Ajv2020 } from "ajv/dist/2020.js";
import { loadBenchmarkPack, readBenchmarkPackCase } from "./benchmark-pack.js";
import { canonicalJson } from "../../sandbox-contracts/src/index.js";
import {
  SEMANTIC_CORE_BENCHMARK,
  SEMANTIC_CORE_EVALUATOR,
  SEMANTIC_CORE_METRICS,
  SEMANTIC_CORE_METRIC_DEFINITIONS
} from "./semantic-core-definitions.js";
import { SEMANTIC_CORE_DIMENSIONS, SEMANTIC_CORE_STATES } from "./semantic-core-types.js";
import type {
  SemanticCoreCase,
  SemanticCoreResponse,
  SemanticCoreCaseResult,
  SemanticCoreSubject,
  SemanticCoreReport,
  SemanticCoreInput
} from "./semantic-core-types.js";
import type { MetricResult } from "./metric-types.js";

const ajv = new Ajv2020({ strict: true, allErrors: true });
const caseCheck = ajv.compile<SemanticCoreCase>(
  JSON.parse(
    readFileSync(
      new URL("../../../schemas/semantic-core-case.schema.json", import.meta.url),
      "utf8"
    )
  )
);
const responseCheck = ajv.compile<SemanticCoreResponse>(
  JSON.parse(
    readFileSync(
      new URL("../../../schemas/semantic-core-response.schema.json", import.meta.url),
      "utf8"
    )
  )
);
// API boundary accepts finite plain JSON only and never evaluates accessor properties.
function plainJson(value: unknown, seen = new Set<object>()): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object" || seen.has(value)) return false;
  if (
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null
  )
    return false;
  seen.add(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(descriptors).filter(
    (k) => !(Array.isArray(value) && k === "length")
  );
  const valid =
    (!Array.isArray(value) || keys.length === value.length) &&
    keys.every((k) => {
      const d = typeof k === "string" ? descriptors[k] : undefined;
      return d?.enumerable === true && "value" in d && plainJson(d.value, seen);
    });
  seen.delete(value);
  return valid;
}
export function validateSemanticCoreCase(value: unknown): value is SemanticCoreCase {
  if (!plainJson(value) || !caseCheck(value)) return false;
  const ids = value.options.map((o) => o.optionId);
  return new Set(ids).size === ids.length && ids.includes(value.oracle.selectedOptionId);
}
export function validateSemanticCoreResponse(value: unknown): value is SemanticCoreResponse {
  return plainJson(value) && responseCheck(value);
}
export function evaluateSemanticCoreCase(
  item: SemanticCoreCase,
  response: unknown
): SemanticCoreCaseResult {
  if (!validateSemanticCoreCase(item)) throw new Error("Invalid semantic core case.");
  let state: SemanticCoreCaseResult["state"];
  if (response === undefined) state = "MISSING";
  else if (
    !validateSemanticCoreResponse(response) ||
    response.caseId !== item.caseId ||
    (response.status === "ANSWER" &&
      !item.options.some((o) => o.optionId === response.selectedOptionId))
  )
    state = "MALFORMED";
  else if (response.status === "ABSTAIN") state = "ABSTAINED";
  else state = response.selectedOptionId === item.oracle.selectedOptionId ? "PASSED" : "INCORRECT";
  return { caseId: item.caseId, dimensionId: item.dimensionId, state, scientificAuthority: "NONE" };
}
function metricsFor(cases: readonly SemanticCoreCaseResult[], packDigest: string): MetricResult[] {
  return SEMANTIC_CORE_METRICS.map((metricIdentity, i) => {
    const selected =
      i < 2 ? cases : cases.filter((c) => c.dimensionId === SEMANTIC_CORE_DIMENSIONS[i - 2]);
    const eligible = selected.filter((c) => c.state === "PASSED" || c.state === "INCORRECT").length;
    const passed = selected.filter((c) => c.state === "PASSED").length;
    const binding = SEMANTIC_CORE_METRIC_DEFINITIONS[i]!.benchmarkBinding;
    return {
      resultId: metricIdentity.metricId,
      metricIdentity,
      ...(binding ? { benchmarkBinding: binding } : {}),
      outcome:
        eligible === 0
          ? { kind: "MISSING", reason: "INSUFFICIENT_EVIDENCE" }
          : { kind: "VALUE", value: i === 0 ? eligible : i === 1 ? passed : passed / eligible },
      aggregation: {
        method: "NONE",
        observedCount: eligible,
        missingCount: selected.length - eligible
      },
      ...(i >= 2
        ? {
            denominator: {
              numerator: passed,
              denominator: eligible,
              eligiblePopulation:
                "eligible evaluated cases: PASSED or INCORRECT within " +
                SEMANTIC_CORE_DIMENSIONS[i - 2]
            }
          }
        : {}),
      uncertainty: { method: "NONE" },
      computation: {
        computationId: metricIdentity.metricId,
        evaluatorId: "evaluateSemanticCoreCase",
        evaluatorVersion: "0.1.0",
        inputReferences: selected.map((c) => c.caseId),
        parameters: {}
      },
      evidenceReferences: [],
      provenanceReference: "pack-sha256:" + packDigest
    };
  });
}
/** Engineering runner only. No provider transport, evidence registration or maturity mutation. */
export async function runSemanticCorePilot(
  packRoot: string,
  subject: SemanticCoreSubject
): Promise<SemanticCoreReport> {
  const loaded = await loadBenchmarkPack(packRoot);
  if (loaded.admission.status !== "ADMISSIBLE" || !loaded.manifest || !loaded.packDigest)
    throw new Error("Pack is not admissible.");
  const manifest = loaded.manifest;
  if (
    canonicalJson(manifest.benchmark) !== canonicalJson(SEMANTIC_CORE_BENCHMARK) ||
    canonicalJson(manifest.evaluator) !== canonicalJson(SEMANTIC_CORE_EVALUATOR) ||
    canonicalJson(manifest.metrics) !== canonicalJson(SEMANTIC_CORE_METRICS) ||
    manifest.cases.length !== 24
  )
    throw new Error("Pilot identity or inventory mismatch.");
  const items: SemanticCoreCase[] = [];
  for (const reference of manifest.cases) {
    const item = await readBenchmarkPackCase(packRoot, reference);
    if (!validateSemanticCoreCase(item) || item.caseId !== reference.caseId)
      throw new Error("Invalid pilot payload or case identity.");
    items.push(item);
  }
  if (!SEMANTIC_CORE_DIMENSIONS.every((d) => items.filter((c) => c.dimensionId === d).length === 8))
    throw new Error("Pilot dimension inventory mismatch.");
  const cases: SemanticCoreCaseResult[] = [];
  for (const item of items) {
    const input: SemanticCoreInput = {
      schemaVersion: item.schemaVersion,
      caseId: item.caseId,
      dimensionId: item.dimensionId,
      target: item.target,
      prompt: item.prompt,
      context: item.context,
      options: structuredClone(item.options),
      eligibleResponseStates: ["ANSWER", "ABSTAIN"]
    };
    let response: unknown;
    try {
      response = await subject(input);
    } catch {
      cases.push({
        caseId: item.caseId,
        dimensionId: item.dimensionId,
        state: "SUBJECT_ERROR",
        scientificAuthority: "NONE"
      });
      continue;
    }
    cases.push(evaluateSemanticCoreCase(item, response));
  }
  const stateCounts = Object.fromEntries(
    SEMANTIC_CORE_STATES.map((state) => [state, cases.filter((c) => c.state === state).length])
  ) as Record<SemanticCoreCaseResult["state"], number>;
  return {
    benchmark: SEMANTIC_CORE_BENCHMARK,
    evaluator: SEMANTIC_CORE_EVALUATOR,
    packDigest: loaded.packDigest.value,
    cases,
    metrics: metricsFor(cases, loaded.packDigest.value),
    stateCounts,
    evidenceKind: "SYNTHETIC_ENGINEERING_ONLY",
    scientificAuthority: "NONE"
  };
}
