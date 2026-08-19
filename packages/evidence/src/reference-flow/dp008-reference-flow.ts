/**
 * @package @semantiq/evidence
 * Full Controlled Synthetic Reference Flow: DP-008 (Out-of-Band Observer) → FP-002 (Context Drift)
 *
 * Complete End-to-End Headless Vertical Slice:
 * Controlled Run Fixture → Canonical Adapter → Trace → Metric → Failure Evidence →
 * Evidence Graph → Matched Contrast → Robustness → Specification Curve →
 * Evidence Decision → Claim → Review → Release → Research Bundle →
 * Partner Study → Pre-registration → Execution Manifest → Eligibility Gate
 */

import {
  EpistemicNature,
  EvidenceConfidence,
  ObservationCategory,
  PartnerRole,
  PatternSeverity,
  RelationType,
  TraceEventSource,
  TraceEventType,
  type Trace
} from "../../../sandbox-contracts/src/index.js";
import { BenchmarkEvidenceBridge } from "../benchmark-evidence-adapter.js";
import type { RawBenchmarkStepLog, TraceRichBenchmarkArtifact } from "../types.js";
import { EvidenceGraphEngine } from "../evidence-graph/evidence-graph-engine.js";
import { RunProfileMatcher } from "../statistical-contrast/run-profile-matcher.js";
import { StatisticalContrastEngine } from "../statistical-contrast/statistical-contrast-engine.js";
import type {
  MatchedContrastReport,
  RunProfile as StatisticalRunProfile
} from "../statistical-contrast/types.js";
import { RobustnessEngine } from "../robustness-diagnostics/robustness-engine.js";
import type {
  RobustnessDiagnosticReport,
  SpecificationCurveReport
} from "../robustness-diagnostics/types.js";
import { EvidenceDecisionPolicy } from "../governance-policy/evidence-decision-policy.js";
import { ClaimRegistryEngine } from "../claim-registry/claim-registry-engine.js";
import type { GovernedEvidenceClaim, GovernedClaimReview } from "../claim-registry/types.js";
import { ResearchBundleBuilder, ResearchBundleVerifier } from "../research-bundles/index.js";
import type { ResearchBundleManifest } from "../research-bundles/types.js";
import {
  PartnerOrganizationRegistry,
  ReplicationRegistryEngine
} from "../partner-exchange/index.js";
import type {
  CrossOrgReplicationAggregation,
  PartnerOrganization,
  PartnerStudy
} from "../partner-exchange/types.js";
import { StudyProtocolGenerator, ProtocolDeviationLedger } from "../study-protocols/index.js";
import type { StudyProtocol } from "../study-protocols/types.js";
import {
  StudyExecutionManifestValidator,
  EPISTEMIC_MANIFEST_DISCLAIMER
} from "../execution-manifests/index.js";
import type {
  ManifestIngestionResult,
  StudyExecutionManifest
} from "../execution-manifests/types.js";
import { ExternalEvidenceEligibilityGate } from "../external-evidence-gate/index.js";
import type { ExternalEvidenceEligibilityDecision } from "../external-evidence-gate/types.js";

export interface ReferenceWorkflowResult {
  readonly adaptedRuns: readonly RawBenchmarkStepLog[];
  readonly traces: readonly Trace[];
  readonly failureObservationsCount: number;
  readonly matchedContrastReport: MatchedContrastReport;
  readonly robustnessReport: RobustnessDiagnosticReport;
  readonly specCurveReport: SpecificationCurveReport;
  readonly decisionVerdict: string;
  readonly claim: GovernedEvidenceClaim;
  readonly review: GovernedClaimReview;
  readonly researchBundle: ResearchBundleManifest;
  readonly partnerOrganization: PartnerOrganization;
  readonly partnerStudy: PartnerStudy;
  readonly studyProtocol: StudyProtocol;
  readonly executionManifest: StudyExecutionManifest;
  readonly manifestIngestion: ManifestIngestionResult;
  readonly eligibilityDecision: ExternalEvidenceEligibilityDecision;
  readonly replicationAggregation: CrossOrgReplicationAggregation;
}

export class Dp008ReferenceFlowRunner {
  private readonly adapter = new BenchmarkEvidenceBridge();
  private readonly graphEngine = new EvidenceGraphEngine();
  private readonly matcher = new RunProfileMatcher();
  private readonly contrastEngine = new StatisticalContrastEngine();
  private readonly robustnessEngine = new RobustnessEngine();
  private readonly decisionPolicy = new EvidenceDecisionPolicy();
  private readonly claimRegistry = new ClaimRegistryEngine();
  private readonly bundleBuilder = new ResearchBundleBuilder();
  private readonly bundleVerifier = new ResearchBundleVerifier();
  private readonly partnerRegistry = new PartnerOrganizationRegistry();
  private readonly replicationRegistry = new ReplicationRegistryEngine();
  private readonly protocolGenerator = new StudyProtocolGenerator();
  private readonly deviationLedger = new ProtocolDeviationLedger();
  private readonly manifestValidator = new StudyExecutionManifestValidator();
  private readonly eligibilityGate = new ExternalEvidenceEligibilityGate();

  /**
   * Executes the full 18-stage headless reference workflow.
   */
  public async executeFlow(): Promise<ReferenceWorkflowResult> {
    // -------------------------------------------------------------
    // Stage 1 & 2: Controlled Run Fixtures & Canonical Adapter
    // -------------------------------------------------------------
    const rawSteps: RawBenchmarkStepLog[] = [];
    for (let i = 1; i <= 10; i++) {
      // Treatment runs (with DP-008 out-of-band observer active)
      rawSteps.push({
        timestamp: new Date(Date.now() + (i * 2 - 1) * 1000).toISOString(),
        type: TraceEventType.TOOL_CALL,
        source: TraceEventSource.AGENT,
        payload: {
          stepIndex: i,
          stepName: `treatment_turn_${i}`,
          agentAction: `execute_tool_with_observer(step=${i})`,
          toolName: "host_pty_observer",
          hadAnomaly: false
        }
      });
      // Control runs (baseline without DP-008 observer)
      rawSteps.push({
        timestamp: new Date(Date.now() + i * 2 * 1000).toISOString(),
        type: TraceEventType.TOOL_CALL,
        source: TraceEventSource.AGENT,
        payload: {
          stepIndex: i,
          stepName: `control_turn_${i}`,
          agentAction: `execute_tool_unobserved(step=${i})`,
          toolName: "unmonitored_shell",
          hadAnomaly: i > 5,
          anomalyType: i > 5 ? "FP-002_context_drift" : undefined
        }
      });
    }

    const artifact: TraceRichBenchmarkArtifact = {
      benchmarkId: "bmk_hacs_v1",
      runId: "run_dp008_treatment_01",
      systemProfileId: "sys_dp008_ref",
      caseId: "case_long_horizon_01",
      timestamp: new Date().toISOString(),
      overallScore: 0.95,
      scoreBreakdown: {
        goal_retention: { score: 0.95, weight: 1.0 }
      },
      providerId: "docker_local",
      isOfflineDeterministic: true,
      durationMs: 500,
      steps: rawSteps
    };

    const evidenceBundle = this.adapter.adaptTraceArtifact(artifact);
    const adaptedRuns = rawSteps;
    const mappedTrace = evidenceBundle.trace!;

    // -------------------------------------------------------------
    // Stage 5 & 6: Failure Evidence & Evidence Graph
    // -------------------------------------------------------------
    const empiricalObservations = mappedTrace.events
      .filter((e) => Boolean((e.payload as any)?.hadAnomaly))
      .map((e, idx) => ({
        id: `obs_fp002_${idx + 1}`,
        runId: mappedTrace.runId,
        patternId: "pat_fp_002",
        category: ObservationCategory.ANOMALY_SIGNAL,
        severity: PatternSeverity.HIGH,
        nature: EpistemicNature.OBSERVED,
        confidence: EvidenceConfidence.EMPIRICAL,
        message: `Empirical drift anomaly observed at step ${(e.payload as any)?.stepIndex}`,
        timestamp: e.timestamp
      }));

    this.graphEngine.addObservation({
      relationId: "rel_08",
      sourceId: "pat_dp008",
      targetId: "pat_fp002",
      relationType: RelationType.REFUTES,
      polarity: "SUPPORTS",
      runId: mappedTrace.runId,
      caseId: "case_long_horizon_01",
      modelId: "gpt-4",
      environmentId: "docker_local",
      confidence: EvidenceConfidence.EMPIRICAL
    });

    // -------------------------------------------------------------
    // Stage 7: Matched Contrast (Bootstrap CI & Sign Test)
    // -------------------------------------------------------------
    const allStatisticalRuns: StatisticalRunProfile[] = [];

    for (let i = 1; i <= 10; i++) {
      allStatisticalRuns.push({
        runId: `run_treatment_${i}`,
        isTreatment: true,
        environment: {
          provider: "docker_local",
          platform: "linux",
          networkIsolated: true,
          os: "linux-x86_64"
        },
        model: {
          modelFamily: "gpt-4",
          modelId: "gpt-4-0613",
          temperature: 0.0
        },
        population: {
          agentCount: 1,
          topology: "single"
        },
        tools: {
          toolCount: 5,
          hasBoundaryGuard: true,
          allowedToolNames: ["host_pty_observer", "read_file"]
        },
        memory: {
          contextWindowTokens: 8192,
          hasMemoryPartitioning: true
        },
        resourcePressure: {
          maxSteps: 20,
          tokenBudget: 50000
        },
        horizon: "long",
        outcomeMetrics: { goal_retention_score: 0.95, failure_rate: 0.0 }
      });

      allStatisticalRuns.push({
        runId: `run_control_${i}`,
        isTreatment: false,
        environment: {
          provider: "docker_local",
          platform: "linux",
          networkIsolated: true,
          os: "linux-x86_64"
        },
        model: {
          modelFamily: "gpt-4",
          modelId: "gpt-4-0613",
          temperature: 0.0
        },
        population: {
          agentCount: 1,
          topology: "single"
        },
        tools: {
          toolCount: 5,
          hasBoundaryGuard: true,
          allowedToolNames: ["unmonitored_shell", "read_file"]
        },
        memory: {
          contextWindowTokens: 8192,
          hasMemoryPartitioning: true
        },
        resourcePressure: {
          maxSteps: 20,
          tokenBudget: 50000
        },
        horizon: "long",
        outcomeMetrics: { goal_retention_score: 0.7, failure_rate: 0.3 }
      });
    }

    const matchedData = this.matcher.matchRuns(allStatisticalRuns, "goal_retention_score");
    const matchedContrastReport = this.contrastEngine.evaluateContrast(
      "goal_retention_score",
      matchedData
    );

    // -------------------------------------------------------------
    // Stage 8 & 9: Robustness Diagnostics & Specification Curve
    // -------------------------------------------------------------
    const robustnessReport = this.robustnessEngine.evaluateRobustnessSuite(
      allStatisticalRuns,
      "goal_retention_score"
    );

    const specCurveReport = this.robustnessEngine.runSpecificationCurve(
      allStatisticalRuns,
      "goal_retention_score"
    );

    // -------------------------------------------------------------
    // Stage 10: Evidence Decision Policy Evaluation
    // -------------------------------------------------------------
    const decisionResult = this.decisionPolicy.evaluate({
      targetId: "rel_08",
      statisticalGrade: matchedContrastReport.evidenceGrade,
      pairCount: matchedContrastReport.matchedPairsCount,
      robustnessGrade: robustnessReport.robustnessGrade,
      specificationStability: specCurveReport.directionStabilityRatio,
      usableSpecifications: specCurveReport.totalSpecificationsEvaluated,
      lowPowerFraction: 0.0,
      negativeControlFailures: 0,
      relationStatus: "supported"
    });

    // -------------------------------------------------------------
    // Stage 11: Governed Claim Proposal & Registration
    // -------------------------------------------------------------
    const governedClaim = this.claimRegistry.draftClaim({
      claimFamilyTopic: "anti_gaming_drift_mitigation",
      targetPatternOrRelationId: "rel_08",
      version: "1.0.0",
      statement:
        "DP-008 out-of-band observer is associated with a 0.25 observed increase in goal retention and mitigation of FP-002 context drift under matched benchmarking conditions.",
      governanceVerdict: decisionResult.verdict,
      evidenceReferences: {
        runIds: ["run_treatment_1", "run_control_1"],
        observationIds: empiricalObservations.map((o) => o.id),
        decisionReportIds: [decisionResult.decisionId],
        sourceIds: ["study_dp008_fp002_ref"]
      }
    });

    // -------------------------------------------------------------
    // Stage 12 & 13: Review & Release Authorization
    // -------------------------------------------------------------
    const review1: GovernedClaimReview = {
      reviewerId: "reviewer_lead_01",
      decision: "approve",
      comments: "Controlled benchmark demonstrates matched contrast with zero critical anomalies.",
      reviewedAt: new Date().toISOString()
    };
    const review2: GovernedClaimReview = {
      reviewerId: "reviewer_peer_02",
      decision: "approve",
      comments: "Independent replication protocol and metrics adhere to governance specification.",
      reviewedAt: new Date().toISOString()
    };

    this.claimRegistry.addReview(governedClaim.id, review1);
    this.claimRegistry.addReview(governedClaim.id, review2);

    const activeClaim = this.claimRegistry.releaseClaim(governedClaim.id);

    // -------------------------------------------------------------
    // Stage 14: Reproducible Research Bundle Assembly & Verification
    // -------------------------------------------------------------
    const builtBundle = this.bundleBuilder.buildBundle({
      bundleId: "bundle_dp008_fp002_ref",
      studyId: "study_dp008_fp002_ref",
      title: "DP-008 Out-of-Band Observer Verification against FP-002",
      author: "SemantIQ Core Research Group",
      claims: [activeClaim],
      contrastReport: matchedContrastReport,
      robustnessReport
    });

    const bundleVerification = this.bundleVerifier.verifyBundle(
      builtBundle.manifest,
      builtBundle.artifacts
    );

    // -------------------------------------------------------------
    // Stage 15: Partner Organization & Study Registration
    // -------------------------------------------------------------
    const partnerOrg = this.partnerRegistry.registerOrganization({
      id: "org_stanford_nlp",
      name: "Stanford NLP Lab",
      role: PartnerRole.ACADEMIC_COLLABORATOR,
      trustTier: "verified_academic",
      contactEmail: "nlp-lab@stanford.edu"
    });

    const partnerStudy: PartnerStudy = {
      id: "study_dp008_stanford_001",
      organizationId: partnerOrg.id,
      title: "Stanford Replication: DP-008 Out-of-Band Observer",
      abstract: "Controlled academic replication evaluating DP-008 against FP-002 context drift.",
      targetPatternOrClaimId: activeClaim.id,
      status: "published",
      bundleId: builtBundle.manifest.bundleId,
      merkleRootHash: builtBundle.manifest.merkleRootHash,
      createdAt: new Date().toISOString()
    };
    this.replicationRegistry.registerStudy(partnerStudy);

    // -------------------------------------------------------------
    // Stage 16: Study Protocol Generation & Pre-registration Freezing
    // -------------------------------------------------------------
    const generatedProtocol = this.protocolGenerator.generateProtocolForRelation({
      protocolId: "proto_dp008_fp002_001",
      title: "Preregistered Protocol: DP-008 Observer Verification",
      targetRelationId: "rel_08",
      targetPatternId: "pat_dp008",
      relationType: RelationType.REFUTES
    });

    const frozenProtocol = this.protocolGenerator.freezeProtocol(generatedProtocol);
    this.deviationLedger.registerProtocol(frozenProtocol);

    // -------------------------------------------------------------
    // Stage 17: Study Execution Manifest Validation
    // -------------------------------------------------------------
    const executionManifest: StudyExecutionManifest = {
      manifestId: "man_exec_dp008_001",
      studyId: partnerStudy.id,
      organizationId: partnerOrg.id,
      protocolId: frozenProtocol.protocolId,
      protocolVersion: frozenProtocol.version,
      preregistrationFingerprint: frozenProtocol.preregistrationHash,
      startedAt: "2026-08-18T10:00:00.000Z",
      completedAt: "2026-08-18T11:00:00.000Z",
      environmentFingerprint: "env_fingerprint_001",
      modelFingerprint: "model_fingerprint_001",
      datasetFingerprint: "dataset_fingerprint_001",
      traceSchemaFingerprint: "trace_schema_fingerprint_001",
      treatmentRunsCount: 20,
      controlRunsCount: 20,
      matchedPairsCount: 20,
      evaluationIds: ["eval_dp008_ext_01", "eval_dp008_ext_02"],
      matchingDimensionsUsed: frozenProtocol.matchingDimensions,
      thresholdsUsed: { accuracy: 0.85 },
      observedInstrumentation: {
        traceCollectionMode: "buffered_event_stream",
        samplingRateHz: 100,
        isolationGuarantees: ["deterministic_seed", "isolated_network"]
      },
      executedNegativeControls: frozenProtocol.negativeControls.map((c) => ({
        controlId: c.controlId,
        executed: true,
        deltaObserved: 0.005,
        boundExpected: c.expectedDeltaBound,
        passedBound: true
      })),
      missingDataReport: {
        totalExpectedObservations: 100,
        observedObservations: 100,
        missingObservationsCount: 0,
        missingDataRatio: 0.0,
        missingReasons: {}
      },
      analysisParameters: { statisticalTest: "exact_sign_test" },
      softwareVersion: "1.0.0",
      partnerAttestation: {
        attestedBy: "Dr. Stanford Collaborator",
        role: "academic_collaborator",
        signatureHex: "0xabcdef123456",
        attestationStatement: "Execution fully adhered to pre-registered protocol.",
        timestamp: "2026-08-18T11:05:00.000Z"
      },
      manifestSha256: "manifest_sha256_dp008_001",
      epistemicDisclaimer: EPISTEMIC_MANIFEST_DISCLAIMER
    };

    const manifestIngestion = this.manifestValidator.validateAndIngestManifest(
      executionManifest,
      frozenProtocol
    );

    // -------------------------------------------------------------
    // Stage 18: External Evidence Eligibility Gate & Replication
    // -------------------------------------------------------------
    const eligibilityDecision = this.eligibilityGate.evaluateSubmission({
      manifest: executionManifest,
      protocol: frozenProtocol,
      bundleVerification,
      deviations: [],
      deviationChainValid: true,
      organization: partnerOrg
    });

    // Register replication record with gate verdict
    this.replicationRegistry.registerReplication({
      replicationId: "rep_dp008_stanford_001",
      originalStudyId: "study_dp008_fp002_ref",
      targetClaimId: activeClaim.id,
      replicatingOrganizationId: partnerOrg.id,
      replicatingStudyId: partnerStudy.id,
      outcome: "support",
      effectDeltaObserved: 0.25,
      baselineDeltaTarget: 0.2,
      contextDiversity: {
        environmentProviders: ["docker_local", "podman_rootless"],
        modelFamilies: ["gpt-4", "claude-3"],
        platforms: ["linux", "darwin"],
        diversityScore: 0.85
      },
      counterevidenceObserved: false,
      conductedAt: "2026-08-18T11:00:00.000Z",
      eligibilityVerdict: eligibilityDecision.verdict,
      epistemicDisclaimer:
        "Replication demonstrates empirical consistency across contexts, not causal proof or universal truth."
    });

    const replicationAggregation = this.replicationRegistry.aggregateReplications(activeClaim.id);

    return Object.freeze({
      adaptedRuns,
      traces: Object.freeze([mappedTrace]),
      failureObservationsCount: empiricalObservations.length,
      matchedContrastReport,
      robustnessReport,
      specCurveReport,
      decisionVerdict: decisionResult.verdict,
      claim: activeClaim,
      review: review1,
      researchBundle: builtBundle.manifest,
      partnerOrganization: partnerOrg,
      partnerStudy,
      studyProtocol: frozenProtocol,
      executionManifest,
      manifestIngestion,
      eligibilityDecision,
      replicationAggregation
    });
  }
}
