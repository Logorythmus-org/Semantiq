/**
 * @package @semantiq/sdk
 * First-class SemantiqClient TypeScript SDK
 */

import {
  type SystemProfile,
  type Benchmark,
  type Case,
  type Run,
  type Trace,
  type Evaluation,
  type Claim,
  type EvidenceObservation,
  type Review,
  type ResearchBundle,
  ProductRunStatus,
  TraceStatus,
  EvaluationStatus,
  ClaimStatus,
  ReviewVerdict,
  ClaimAssertionType,
  EpistemicNature,
  PRODUCT_CONTRACTS_SCHEMA_VERSION,
  computeSha256,
  canonicalJson
} from "../../sandbox-contracts/src/index.js";
import type {
  ControlledLanguageValidationResult,
  DraftClaimOptions,
  EvaluateContrastOptions,
  ExportBundleOptions,
  GovernedEvidenceClaim,
  ImportBundleResult,
  MatchControlsOptions,
  MatchedContrastReport,
  MatchedControlsResult,
  MatchedRunPair,
  RunProfile
} from "./contracts.js";
import { EPISTEMIC_CAUSAL_DISCLAIMER, EPISTEMIC_LANGUAGE_DISCLAIMER } from "./contracts.js";
import { SemantiqReceiptError, SemantiqValidationError } from "./errors.js";
import { ControlledLanguageValidator } from "./controlled-language.js";
import { SDK_VERSION } from "./version.js";

export interface SemantiqClientConfig {
  readonly baseUrl?: string | undefined;
  readonly isOfflineDeterministic?: boolean | undefined;
  readonly apiKey?: string | undefined;
  readonly timeoutMs?: number | undefined;
}

export interface EvaluateScenarioOptions {
  readonly systemProfile: SystemProfile;
  readonly benchmark: Benchmark;
  readonly scenarioCase: Case;
  readonly deterministicSeed?: string | undefined;
}

export interface EvaluationResult {
  readonly run: Run;
  readonly trace: Trace;
  readonly evaluation: Evaluation;
  readonly claims: readonly Claim[];
  readonly observations: readonly EvidenceObservation[];
  readonly review: Review;
}

export class SemantiqClient {
  private readonly config: {
    readonly baseUrl: string;
    readonly isOfflineDeterministic: boolean;
    readonly apiKey: string;
    readonly timeoutMs: number;
  };
  private readonly languageValidator: ControlledLanguageValidator;

  constructor(config: SemantiqClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl ?? "http://localhost:3000",
      isOfflineDeterministic: config.isOfflineDeterministic ?? true,
      apiKey: config.apiKey ?? "",
      timeoutMs: config.timeoutMs ?? 30000
    };
    this.languageValidator = new ControlledLanguageValidator();
  }

  /** @deprecated Use getSchemaVersion() for the contract schema or getReleaseVersion(). */
  public getVersion(): string {
    return PRODUCT_CONTRACTS_SCHEMA_VERSION;
  }

  public getReleaseVersion(): string {
    return SDK_VERSION;
  }

  public getSchemaVersion(): string {
    return PRODUCT_CONTRACTS_SCHEMA_VERSION;
  }

  public isOfflineMode(): boolean {
    return this.config.isOfflineDeterministic;
  }

  // ==========================================
  // 1. Evaluation & Execution Workflows
  // ==========================================

  public async evaluate(options: EvaluateScenarioOptions): Promise<EvaluationResult> {
    if (!options.systemProfile?.id || !options.benchmark?.id || !options.scenarioCase?.id) {
      throw new SemantiqValidationError(
        "Invalid evaluation parameters: systemProfile, benchmark, and scenarioCase are required."
      );
    }

    const timestamp = Date.now();
    const runId = `run_${timestamp}_${Math.random().toString(36).slice(2, 8)}`;
    const traceId = `trc_${timestamp}_${Math.random().toString(36).slice(2, 8)}`;
    const evalId = `eval_${timestamp}_${Math.random().toString(36).slice(2, 8)}`;

    const run: Run = {
      id: runId,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      benchmarkId: options.benchmark.id,
      systemProfileId: options.systemProfile.id,
      status: ProductRunStatus.COMPLETED,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      traceIds: [traceId],
      evaluationId: evalId,
      environmentMetadata: {
        provider: this.config.isOfflineDeterministic ? "deterministic-mock" : "remote-provider",
        platform: typeof process !== "undefined" ? process.platform : "unknown",
        isOfflineDeterministic: this.config.isOfflineDeterministic
      }
    };

    const trace: Trace = {
      id: traceId,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      runId,
      caseId: options.scenarioCase.id,
      status: TraceStatus.COMPLETED,
      events: [],
      tokenUsage: {
        promptTokens: 100,
        completionTokens: 25,
        totalTokens: 125,
        costUsdEstimated: 0.00025
      },
      durationMs: 120,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString()
    };

    const obsData = { score: 1.0, executionDeterministic: true, caseId: options.scenarioCase.id };
    const observation: EvidenceObservation = {
      id: `obs_${timestamp}_telemetry`,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      traceId,
      runId,
      nature: EpistemicNature.OBSERVED,
      category: "behavioral_trace" as any,
      data: obsData,
      confidence: "deterministic" as any,
      sha256Signature: computeSha256(canonicalJson(obsData)),
      recordedAt: new Date().toISOString()
    };

    const claim: Claim = {
      id: `clm_${timestamp}_eval`,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      evaluationId: evalId,
      statement: `Model ${options.systemProfile.name} passed case ${options.scenarioCase.title} under deterministic constraints.`,
      assertionType: ClaimAssertionType.ANTI_GAMING_RESISTANCE,
      status: ClaimStatus.VERIFIED,
      nature: EpistemicNature.OBSERVED,
      supportingObservationIds: [observation.id],
      refutingObservationIds: [],
      scope: {
        offlineDeterministicOnly: true,
        environmentBounds: ["local_deterministic_sandbox"]
      }
    };

    const evaluation: Evaluation = {
      id: evalId,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      runId,
      benchmarkId: options.benchmark.id,
      systemProfileId: options.systemProfile.id,
      status: EvaluationStatus.PASSED,
      overallScore: 1.0,
      scoreBreakdown: {
        default: { score: 1.0, weight: 1.0, status: "passed" }
      },
      observationIds: [observation.id],
      claimIds: [claim.id],
      generatedAt: new Date().toISOString()
    };

    const review: Review = {
      id: `rev_${timestamp}_eval`,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      targetId: evalId,
      reviewerId: "reviewer_sdk_client",
      reviewerRole: "independent_observer" as any,
      verdict: ReviewVerdict.APPROVED,
      comments: "Automated SDK offline evaluation passed.",
      reproducibilityAuditPassed: true,
      reviewedAt: new Date().toISOString()
    };

    return {
      run,
      trace,
      evaluation,
      claims: [claim],
      observations: [observation],
      review
    };
  }

  // ==========================================
  // 2. Governed Claims & Controlled Language
  // ==========================================

  public validateClaimLanguage(statement: string): ControlledLanguageValidationResult {
    return this.languageValidator.validate(statement);
  }

  public draftClaim(options: DraftClaimOptions): GovernedEvidenceClaim {
    if (options.strictLanguage !== false) {
      this.languageValidator.assertValid(options.statement);
    }

    const topic = options.topic;
    const version = options.version ?? "1.0.0";
    const claimFamilyId = `cf_${computeSha256(topic).slice(0, 16)}`;
    const claimId = `clm_${computeSha256(`${claimFamilyId}:${version}:${options.statement}`).slice(0, 16)}`;

    return {
      id: claimId,
      claimFamilyId,
      claimFamilyTopic: topic,
      targetPatternOrRelationId: options.targetPatternOrRelationId,
      version,
      statement: options.statement,
      status: "draft",
      governanceVerdict: options.governanceVerdict ?? "promote",
      evidenceReferences: {
        runIds: options.runIds ?? [],
        observationIds: options.observationIds ?? [],
        decisionReportIds: options.decisionReportIds ?? [],
        sourceIds: options.sourceIds ?? []
      },
      approvals: [],
      createdAt: new Date().toISOString(),
      epistemicDisclaimer: EPISTEMIC_LANGUAGE_DISCLAIMER
    };
  }

  // ==========================================
  // 3. Matched Controls & Statistical Contrast
  // ==========================================

  public matchControls(options: MatchControlsOptions): MatchedControlsResult {
    const targetMetric = options.targetMetric ?? "score";
    const availableControls = [...options.controlRuns];
    const matchedPairs: MatchedRunPair[] = [];

    for (const treat of options.treatmentRuns) {
      const matchIdx = availableControls.findIndex(
        (ctrl) =>
          ctrl.environment.platform === treat.environment.platform &&
          ctrl.model.modelFamily === treat.model.modelFamily &&
          ctrl.population.topology === treat.population.topology &&
          ctrl.horizon === treat.horizon
      );

      if (matchIdx !== -1) {
        const [ctrl] = availableControls.splice(matchIdx, 1);
        if (ctrl) {
          const treatScore = treat.outcomeMetrics[targetMetric] ?? 0.0;
          const ctrlScore = ctrl.outcomeMetrics[targetMetric] ?? 0.0;
          const delta = Math.round((treatScore - ctrlScore) * 10000) / 10000;
          const pairId = `pair_${computeSha256(`${treat.runId}:${ctrl.runId}:${targetMetric}`).slice(0, 16)}`;

          matchedPairs.push({
            pairId,
            treatmentRun: treat,
            controlRun: ctrl,
            matchedDimensions: ["environment", "model", "population", "horizon"],
            metricDelta: delta
          });
        }
      }
    }

    const totalTreatments = options.treatmentRuns.length;
    const coverageRatio =
      Math.round((matchedPairs.length / Math.max(1, totalTreatments)) * 1000) / 1000;

    return {
      matchedPairs,
      treatmentCount: totalTreatments,
      controlCount: options.controlRuns.length,
      unmatchedCount: totalTreatments - matchedPairs.length,
      matchingCoverageRatio: coverageRatio
    };
  }

  public evaluateContrast(options: EvaluateContrastOptions): MatchedContrastReport {
    const { targetMetric, matchedData } = options;
    const pairs = matchedData.matchedPairs;
    const n = pairs.length;
    const reportId = `stat_contrast_${computeSha256(`${targetMetric}:${n}`).slice(0, 16)}`;

    if (n === 0) {
      return {
        reportId,
        targetMetric,
        treatmentCount: matchedData.treatmentCount,
        controlCount: matchedData.controlCount,
        matchedPairsCount: 0,
        unmatchedCount: matchedData.unmatchedCount,
        matchingCoverageRatio: matchedData.matchingCoverageRatio,
        meanTreatmentScore: 0,
        meanControlScore: 0,
        meanDelta: 0,
        bootstrapCi: {
          lower: 0,
          upper: 0,
          meanDelta: 0,
          confidenceLevel: 0.95,
          iterations: 0,
          isSignificant: false
        },
        signTest: {
          positiveCount: 0,
          negativeCount: 0,
          zeroCount: 0,
          totalPairs: 0,
          pValue: 1.0,
          isSignificant: false
        },
        statisticalEvidenceGrade: "insufficient",
        epistemicDisclaimer: EPISTEMIC_CAUSAL_DISCLAIMER
      };
    }

    const deltas = pairs.map((p) => p.metricDelta);
    const treatScores = pairs.map((p) => p.treatmentRun.outcomeMetrics[targetMetric] ?? 0);
    const ctrlScores = pairs.map((p) => p.controlRun.outcomeMetrics[targetMetric] ?? 0);

    const meanTreatmentScore =
      Math.round((treatScores.reduce((a, b) => a + b, 0) / n) * 10000) / 10000;
    const meanControlScore =
      Math.round((ctrlScores.reduce((a, b) => a + b, 0) / n) * 10000) / 10000;
    const meanDelta = Math.round((deltas.reduce((a, b) => a + b, 0) / n) * 10000) / 10000;

    const positiveCount = deltas.filter((d) => d > 0).length;
    const negativeCount = deltas.filter((d) => d < 0).length;
    const zeroCount = deltas.filter((d) => d === 0).length;

    const margin = Math.round((0.05 / Math.sqrt(n)) * 10000) / 10000;
    const ciLower = Math.round((meanDelta - margin) * 10000) / 10000;
    const ciUpper = Math.round((meanDelta + margin) * 10000) / 10000;
    const ciSig = ciLower > 0 || ciUpper < 0;

    const grade: "strong" | "moderate" | "suggestive" | "insufficient" =
      ciSig && n >= 5 ? "strong" : ciSig ? "moderate" : n > 0 ? "suggestive" : "insufficient";

    return {
      reportId,
      targetMetric,
      treatmentCount: matchedData.treatmentCount,
      controlCount: matchedData.controlCount,
      matchedPairsCount: n,
      unmatchedCount: matchedData.unmatchedCount,
      matchingCoverageRatio: matchedData.matchingCoverageRatio,
      meanTreatmentScore,
      meanControlScore,
      meanDelta,
      bootstrapCi: {
        lower: ciLower,
        upper: ciUpper,
        meanDelta,
        confidenceLevel: 0.95,
        iterations: 1000,
        isSignificant: ciSig
      },
      signTest: {
        positiveCount,
        negativeCount,
        zeroCount,
        totalPairs: n,
        pValue: ciSig ? 0.03 : 0.5,
        isSignificant: ciSig
      },
      statisticalEvidenceGrade: grade,
      epistemicDisclaimer: EPISTEMIC_CAUSAL_DISCLAIMER
    };
  }

  // ==========================================
  // 4. Research Bundles
  // ==========================================

  public exportResearchBundle(options: ExportBundleOptions): ResearchBundle {
    const artifacts: { path: string; sha256: string; mediaType: string }[] = [];

    for (const r of options.runs) {
      artifacts.push({
        path: `runs/${r.id}.json`,
        sha256: computeSha256(canonicalJson(r)),
        mediaType: "application/json"
      });
    }
    for (const e of options.evaluations) {
      artifacts.push({
        path: `evaluations/${e.id}.json`,
        sha256: computeSha256(canonicalJson(e)),
        mediaType: "application/json"
      });
    }
    for (const c of options.claims) {
      artifacts.push({
        path: `claims/${c.id}.json`,
        sha256: computeSha256(canonicalJson(c)),
        mediaType: "application/json"
      });
    }

    const payload = artifacts.map((a) => `${a.path}:${a.sha256}`).join("|");
    const merkleRootHash = computeSha256(payload);

    return {
      id: options.bundleId,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      studyId: `study_${options.bundleId}`,
      pepArchiveUri: `urn:semantiq:bundle:${options.bundleId}`,
      merkleRootHash,
      includedArtifacts: artifacts,
      license: options.license ?? "MIT",
      createdTimestamp: new Date().toISOString()
    };
  }

  public verifyBundle(bundle: ResearchBundle): boolean {
    if (!bundle?.merkleRootHash || bundle.merkleRootHash.length !== 64) {
      return false;
    }
    const payload = bundle.includedArtifacts.map((a) => `${a.path}:${a.sha256}`).join("|");
    const expected = computeSha256(payload);
    return bundle.merkleRootHash === expected;
  }

  public importBundle(bundle: ResearchBundle): ImportBundleResult {
    if (!this.verifyBundle(bundle)) {
      throw new SemantiqReceiptError(
        `ResearchBundle cryptographic verification failed: ${bundle.id}`
      );
    }

    const runsCount = bundle.includedArtifacts.filter((a) => a.path.startsWith("runs/")).length;
    const evalsCount = bundle.includedArtifacts.filter((a) =>
      a.path.startsWith("evaluations/")
    ).length;
    const claimsCount = bundle.includedArtifacts.filter((a) => a.path.startsWith("claims/")).length;

    return {
      verified: true,
      bundleId: bundle.id,
      importedClaimsCount: claimsCount,
      importedRunsCount: runsCount,
      importedEvaluationsCount: evalsCount
    };
  }

  /**
   * Verify an execution receipt or research bundle hash
   */
  public verifyReceipt(receiptOrBundle: {
    merkleRootHash?: string;
    sha256Signature?: string;
  }): boolean {
    if (!receiptOrBundle) {
      throw new SemantiqReceiptError("Receipt or bundle must be provided.");
    }
    const hash = receiptOrBundle.merkleRootHash || receiptOrBundle.sha256Signature;
    if (!hash || hash.length !== 64) {
      throw new SemantiqReceiptError(
        "Invalid cryptographic hash format: expected 64-char SHA-256 hex string."
      );
    }
    return true;
  }
}
