/**
 * @package @semantiq/evidence
 * Deterministic Study Protocol Generator
 * 
 * Invariants:
 * 1. Protocol generation is deterministic based on target relation and pattern inputs.
 * 2. Preregistration hash ensures cryptographic immutability upon freezing.
 * 3. Preregistration guards against p-hacking; it does not confer truth.
 */

import {
  canonicalJson,
  computeSha256,
  PRODUCT_CONTRACTS_SCHEMA_VERSION,
  type RelationType
} from "../../../sandbox-contracts/src/index.js";
import {
  EPISTEMIC_PREREGISTRATION_DISCLAIMER,
  type AnalysisSpecification,
  type ExportRequirements,
  type ExposureDefinition,
  type InstrumentationSpec,
  type NegativeControlSpec,
  type OutcomeDefinition,
  type PopulationCriteria,
  type ProtocolMetricSpec,
  type SampleGuidance,
  type StudyProtocol
} from "./types.js";

export interface GenerateProtocolOptions {
  readonly protocolId?: string | undefined;
  readonly title: string;
  readonly targetRelationId: string;
  readonly targetPatternId: string;
  readonly relationType?: RelationType | undefined;
  readonly researchQuestion?: string | undefined;
  readonly primaryMetric?: string | undefined;
  readonly targetEffectDelta?: number | undefined;
  readonly systemFamily?: string | undefined;
  readonly requiredCapabilities?: readonly string[] | undefined;
}

export class StudyProtocolGenerator {
  /**
   * Deterministically generates a standardized study design and pre-registration protocol.
   */
  public generateProtocolForRelation(options: GenerateProtocolOptions): StudyProtocol {
    const protocolId =
      options.protocolId ??
      `proto_${computeSha256(`${options.targetRelationId}:${options.targetPatternId}:${options.title}`).slice(0, 16)}`;

    const researchQuestion =
      options.researchQuestion ??
      `Does application of pattern ${options.targetPatternId} via relation ${options.targetRelationId} demonstrate a robust, statistically significant delta on target outcome metrics under matched control conditions?`;

    const primaryMetric = options.primaryMetric ?? "recovery_success_rate";
    const targetEffectDelta = options.targetEffectDelta ?? 0.20;

    const exposure: ExposureDefinition = {
      name: `Pattern Application: ${options.targetPatternId}`,
      treatmentCondition: `Execution with ${options.targetPatternId} active (boundary guard, retry mitigation, circuit breaker)`,
      controlCondition: `Baseline execution with standard unmitigated runtime configuration`
    };

    const outcome: OutcomeDefinition = {
      primaryMetric,
      targetEffectDelta,
      measurementWindowMs: 60000
    };

    const population: PopulationCriteria = {
      systemFamily: options.systemFamily ?? "autonomous_agent_v1",
      requiredCapabilities: Object.freeze(
        options.requiredCapabilities ?? ["tool_call", "multi_turn_reasoning", "state_recovery"]
      ),
      excludedConfigurations: Object.freeze(["non_deterministic_temperature_high", "unbounded_network_access"])
    };

    const matchingDimensions: readonly string[] = Object.freeze([
      "environment",
      "model",
      "population",
      "tools",
      "memory",
      "resource_pressure",
      "horizon"
    ]);

    const instrumentation: InstrumentationSpec = {
      traceCollectionMode: "buffered_event_stream",
      samplingRateHz: 100,
      isolationGuarantees: Object.freeze(["deterministic_seed", "filesystem_sandbox_isolation", "network_mocking"])
    };

    const metrics: readonly ProtocolMetricSpec[] = Object.freeze([
      {
        metricId: primaryMetric,
        name: `Primary Outcome: ${primaryMetric}`,
        description: `Normalized 0.0-1.0 performance metric measuring mitigation effectiveness`,
        expectedDirection: "increase"
      },
      {
        metricId: "failure_rate",
        name: "Secondary: Failure Rate",
        description: "Rate of unhandled anomalies or safety violations during task horizon",
        expectedDirection: "decrease"
      },
      {
        metricId: "step_latency_ms",
        name: "Secondary: Step Latency",
        description: "Execution time per cognitive step",
        expectedDirection: "invariance"
      }
    ]);

    const negativeControls: readonly NegativeControlSpec[] = Object.freeze([
      {
        controlId: "neg_ctrl_sham_intervention",
        nullHypothesisDescription: "Applying a no-op placeholder pattern produces delta within bounds |delta| <= 0.05",
        expectedDeltaBound: 0.05
      },
      {
        controlId: "neg_ctrl_unrelated_metric",
        nullHypothesisDescription: "Mitigation does not alter unrelated deterministic clock ticks",
        expectedDeltaBound: 0.01
      }
    ]);

    const analysisSpecification: AnalysisSpecification = {
      primaryStatisticalTest: "exact_sign_test",
      significanceAlpha: 0.05,
      bootstrapIterations: 2000
    };

    const sampleGuidance: SampleGuidance = {
      minimumPairsRequired: 8,
      recommendedPairsForGradeA: 20,
      statisticalPowerTarget: 0.80
    };

    const exportRequirements: ExportRequirements = {
      requireFullArtifacts: true,
      allowRedaction: true,
      merkleVerificationRequired: true
    };

    const createdAt = new Date().toISOString();

    const payloadToHash = {
      protocolId,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      title: options.title,
      researchQuestion,
      targetRelationId: options.targetRelationId,
      targetPatternId: options.targetPatternId,
      exposure,
      outcome,
      population,
      matchingDimensions,
      instrumentation,
      metrics,
      negativeControls,
      analysisSpecification,
      sampleGuidance,
      exportRequirements,
      status: "draft" as const,
      createdAt
    };

    const preregistrationHash = computeSha256(canonicalJson(payloadToHash));

    const protocol: StudyProtocol = {
      protocolId,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      title: options.title,
      researchQuestion,
      targetRelationId: options.targetRelationId,
      targetPatternId: options.targetPatternId,
      exposureDefinition: Object.freeze(exposure),
      outcomeDefinition: Object.freeze(outcome),
      populationCriteria: Object.freeze(population),
      matchingDimensions,
      instrumentation: Object.freeze(instrumentation),
      metrics,
      negativeControls,
      analysisSpecification: Object.freeze(analysisSpecification),
      sampleGuidance: Object.freeze(sampleGuidance),
      exportRequirements: Object.freeze(exportRequirements),
      preregistrationHash,
      status: "draft",
      createdAt,
      epistemicDisclaimer: EPISTEMIC_PREREGISTRATION_DISCLAIMER
    };

    return Object.freeze(protocol);
  }

  /**
   * Freezes and timestamps a study protocol, making it an immutable pre-registration contract.
   */
  public freezeProtocol(protocol: StudyProtocol): StudyProtocol {
    if (protocol.status === "frozen") {
      return protocol;
    }

    const frozenAt = new Date().toISOString();
    const frozenPayload = {
      ...protocol,
      status: "frozen" as const,
      frozenAt
    };

    const preregistrationHash = computeSha256(canonicalJson(frozenPayload));

    const frozenProtocol: StudyProtocol = {
      ...protocol,
      status: "frozen",
      frozenAt,
      preregistrationHash
    };

    return Object.freeze(frozenProtocol);
  }
}
