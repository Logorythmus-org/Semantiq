import { execFile } from "node:child_process";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { canonicalJson, computeSha256 } from "../../sandbox-contracts/src/index.js";
import {
  S12_EXECUTION_STRATA,
  S12_SUBJECT,
  S12LocalToolExecutor,
  OpenRouterSubjectAdapter,
  executionCaptureDigest,
  s12ProspectiveConfigDigest,
  type OpenRouterEndpointMetadata,
  type OpenRouterGenerationResponse,
  type OpenRouterModelMetadata,
  type OpenRouterTransport,
  type S12ExecutionCapture,
  mapExactRepeatabilityToS05
} from "./s12-openrouter-feasibility.js";
import {
  S12CommandDiagnosticSidecarBuilder,
  type S12DiagnosticProjector
} from "./s12-command-diagnostic-sidecar.js";
import {
  createS12ExecutionCaptureFromEvents,
  nodeToolOperations
} from "./s12-canonical-qualification.js";
import { S12QualificationRunner, type S12QualificationResult } from "./s12-qualification-runner.js";
import { EvidenceSystem, EvidenceVerifier } from "./evidence.js";
import {
  EVIDENCE_COMPLETENESS_DIMENSIONS,
  type ArtifactReference,
  type EvidencePackage,
  type EvidencePackageInput,
  type EvidenceCompletenessStatus,
  type EvidenceValue,
  type VerificationOutcome,
  type EnvironmentManifest
} from "./evidence-types.js";

const execFileAsync = promisify(execFile);

export const S12_TRACK_A_FIXTURE = {
  scenarioId: "s12_pipeline_qualification_edit",
  version: "0.1.0",
  taskSourcePath: "src/message.mjs",
  startingValue: "alpha",
  expectedFinalValue: "beta",
  startingIdentity: "df341451ae48e7b483d95872355ea9a381165de45c7f88227828d2562c81c715",
  protectedMaterialDigest: "10a2c07b3e2c76a76a1d381b51be9f261d724a7c7b72b93311ef4333513c43a6"
} as const;

const STARTING_PATHS = [
  "README.md",
  "TASK.md",
  "fixture-manifest.json",
  "package.json",
  "src/message.mjs"
] as const;

const PROTECTED_PATHS = [
  "README.md",
  "TASK.md",
  "fixture-manifest.json",
  "package.json",
  "verification-contract.json",
  "verifier/final-state.test.mjs"
] as const;

const FINAL_SOURCE = 'export function getMessage() {\n  return "beta";\n}\n';
const SOURCE_PROOF = Symbol("verified-s12-track-a-starting-bytes");
const verifiedSourceProofs = new WeakSet<object>();

type StartingRead =
  | { readonly ok: true; readonly digest: string; readonly fileDigests: readonly FileDigest[] }
  | { readonly ok: false; readonly missing: boolean; readonly reason: string };

interface FileDigest {
  readonly path: string;
  readonly sha256: string;
}

interface VerifiedStartingBytes {
  readonly [SOURCE_PROOF]: true;
  readonly startingIdentity: string;
  readonly protectedMaterialDigest: string;
}

export type S12TrackAOutcome = "QUALIFIED" | "NOT_QUALIFIED" | "MISSING";

export type S12TrackAWitness =
  | "WRITE_BETA"
  | "NO_EDIT"
  | "WRITE_WRONG_VALUE"
  | "FALSE_COMPLETION_CLAIM"
  | "MISLEADING_TRACE"
  | "MISSING_REQUIRED_ARTIFACT";

export interface S12TrackAVerification {
  readonly verifierId: "s12_track_a_final_state_verifier";
  readonly verifierVersion: "0.1.0";
  readonly outcome: S12TrackAOutcome;
  readonly criterion: "SATISFIED" | "NOT_SATISFIED" | "UNVERIFIABLE";
  readonly verifierIntegrity: "VERIFIED" | "FAILED";
  readonly startingIdentity: string;
  readonly protectedMaterialDigest: string;
  readonly finalSourceDigest?: string | undefined;
  readonly testCommand?: string | undefined;
  readonly testExitCode?: number | undefined;
  readonly testStdoutDigest?: string | undefined;
  readonly testStderrDigest?: string | undefined;
  readonly failure?: string | undefined;
  readonly failureClassification?:
    | "RECONSTRUCTION_DEFECT"
    | "PRE_EXISTING_DEFECT"
    | "ENVIRONMENT_BLOCK"
    | "UNRESOLVED"
    | undefined;
  readonly authority: "INTERNAL_CONSISTENCY_ONLY";
  readonly scientificAuthority: "NONE";
  readonly verificationDigest: string;
}

export interface S12TrackARepeatabilityProjection {
  readonly type: "TRACK_A_REPEATABILITY_PROJECTION";
  readonly digest: string;
  readonly material: Readonly<Record<string, unknown>>;
}

export interface S12TrackAS05Projection {
  readonly scope: "RELIABILITY_S05";
  readonly studyId: "s12_track_a_pipeline_qualification_repeatability";
  readonly method: "EXACT_REPEATABILITY";
  readonly comparedProjectionDigests: readonly string[];
  readonly exactMatch: boolean;
  readonly canonicalSemanticDigest: ReturnType<
    typeof mapExactRepeatabilityToS05
  >["current"]["semanticDigest"];
  readonly authority: "INTERNAL_CONSISTENCY_ONLY";
  readonly scientificAuthority: "NONE";
}

export interface S12TrackAS09Lineage {
  readonly packageId: string;
  readonly packageDigest?: string | undefined;
  readonly captureReference: string;
  readonly captureDigest: string;
  readonly internalVerification: VerificationOutcome;
  readonly verification?: import("./evidence-types.js").EvidenceVerificationResult | undefined;
  readonly evidencePackage?: EvidencePackage | undefined;
  readonly failure?: string | undefined;
  readonly authority: "INTERNAL_CONSISTENCY_ONLY";
  readonly scientificAuthority: "NONE";
}

/** S-09 is a required integrity condition, never a sufficient Track-A qualification condition. */
export function combineS12TrackAQualificationOutcome(
  outcome: S12TrackAOutcome,
  s09Outcome: VerificationOutcome
): S12TrackAOutcome {
  return outcome === "QUALIFIED" && s09Outcome !== "VERIFIED_INTERNAL_CONSISTENCY"
    ? "NOT_QUALIFIED"
    : outcome;
}

export interface S12TrackAQualificationResult {
  readonly outcome: S12TrackAOutcome;
  readonly startingIdentity?: string | undefined;
  readonly protectedMaterialDigest?: string | undefined;
  readonly qualification?: S12QualificationResult | undefined;
  readonly verification?: S12TrackAVerification | undefined;
  readonly capture?: S12ExecutionCapture | undefined;
  readonly captureDigest?: string | undefined;
  readonly repeatabilityProjection?: S12TrackARepeatabilityProjection | undefined;
  readonly s05Projection?: S12TrackAS05Projection | undefined;
  readonly s09?: S12TrackAS09Lineage | undefined;
  readonly diagnosticSidecar?: ReturnType<S12CommandDiagnosticSidecarBuilder["build"]>;
}

let trackAExecutionSequence = 0;
const trackAResultProofs = new WeakMap<
  object,
  {
    readonly capture: S12ExecutionCapture;
    readonly projection: S12TrackARepeatabilityProjection;
    readonly verification: S12TrackAVerification;
  }
>();

/** Compares two distinct Track-A results produced by independent governed executions. */
export function compareS12TrackARepeatability(
  first: S12TrackAQualificationResult,
  second: S12TrackAQualificationResult
): S12TrackAS05Projection {
  const firstProof = trackAResultProofs.get(first);
  const secondProof = trackAResultProofs.get(second);
  if (!firstProof || !secondProof) throw new Error("TRACK_A_REPEATABILITY_UNPROVEN_EXECUTION");
  if (first === second) throw new Error("TRACK_A_REPEATABILITY_REQUIRES_DISTINCT_EXECUTIONS");
  const firstCapture = first.capture;
  const secondCapture = second.capture;
  const firstProjection = first.repeatabilityProjection;
  const secondProjection = second.repeatabilityProjection;
  if (
    !firstCapture ||
    !secondCapture ||
    !firstProjection ||
    !secondProjection ||
    firstCapture !== firstProof.capture ||
    secondCapture !== secondProof.capture ||
    firstProjection !== firstProof.projection ||
    secondProjection !== secondProof.projection ||
    first.verification !== firstProof.verification ||
    second.verification !== secondProof.verification ||
    firstCapture.runId === secondCapture.runId ||
    firstCapture.attemptId === secondCapture.attemptId ||
    firstProjection.digest !==
      computeSha256(canonicalJson(repeatabilityMaterial(firstCapture, first.verification))) ||
    secondProjection.digest !==
      computeSha256(canonicalJson(repeatabilityMaterial(secondCapture, second.verification)))
  )
    throw new Error("TRACK_A_REPEATABILITY_INVALID_EXECUTION_EVIDENCE");
  return createS05Projection(
    [firstProjection, secondProjection],
    [
      `capture:${executionCaptureDigest(firstCapture)}`,
      `capture:${executionCaptureDigest(secondCapture)}`
    ]
  );
}

export async function verifyS12TrackAStartingFixture(
  workspaceRoot: string,
  callerClaimedDigest?: string
): Promise<{
  readonly outcome: S12TrackAOutcome;
  readonly actualStartingIdentity?: string | undefined;
  readonly actualProtectedMaterialDigest?: string | undefined;
  readonly failure?: string | undefined;
}> {
  // Caller claims are deliberately ignored; only bytes read from the workspace are authoritative.
  void callerClaimedDigest;
  const starting = await digestFiles(workspaceRoot, STARTING_PATHS);
  const protectedMaterial = await digestFiles(workspaceRoot, PROTECTED_PATHS);
  if (!starting.ok || !protectedMaterial.ok) {
    return {
      outcome:
        (starting.ok || !starting.missing) && (protectedMaterial.ok || !protectedMaterial.missing)
          ? "NOT_QUALIFIED"
          : "MISSING",
      failure: starting.ok
        ? protectedMaterial.ok
          ? "IDENTITY_DIGEST_FAILURE"
          : protectedMaterial.reason
        : starting.reason
    };
  }
  const manifest = await readManifest(workspaceRoot);
  if (!manifest) return { outcome: "NOT_QUALIFIED", failure: "FIXTURE_MANIFEST_INVALID" };
  const outcome =
    manifest.scenarioId === S12_TRACK_A_FIXTURE.scenarioId &&
    manifest.scenarioVersion === S12_TRACK_A_FIXTURE.version &&
    starting.digest === S12_TRACK_A_FIXTURE.startingIdentity &&
    protectedMaterial.digest === S12_TRACK_A_FIXTURE.protectedMaterialDigest
      ? "QUALIFIED"
      : "NOT_QUALIFIED";
  return {
    outcome,
    actualStartingIdentity: starting.digest,
    actualProtectedMaterialDigest: protectedMaterial.digest,
    ...(outcome === "NOT_QUALIFIED"
      ? { failure: "FIXTURE_IDENTITY_OR_PROTECTED_MATERIAL_DRIFT" }
      : {})
  };
}

export class S12TrackAFinalStateVerifier {
  async verify(workspaceRoot: string, startingBytesProof: unknown): Promise<S12TrackAVerification> {
    if (!isVerifiedStartingBytes(startingBytesProof))
      return finishVerification({
        outcome: "NOT_QUALIFIED",
        criterion: "NOT_SATISFIED",
        verifierIntegrity: "FAILED",
        startingIdentity: "UNVERIFIED",
        protectedMaterialDigest: "UNVERIFIED",
        failure: "STARTING_BYTE_PROOF_INVALID",
        failureClassification: "UNRESOLVED"
      });

    const protectedMaterial = await digestFiles(workspaceRoot, PROTECTED_PATHS);
    if (!protectedMaterial.ok) {
      return finishVerification({
        outcome: protectedMaterial.missing ? "MISSING" : "NOT_QUALIFIED",
        criterion: protectedMaterial.missing ? "UNVERIFIABLE" : "NOT_SATISFIED",
        verifierIntegrity: "FAILED",
        startingIdentity: startingBytesProof.startingIdentity,
        protectedMaterialDigest: startingBytesProof.protectedMaterialDigest,
        failure: protectedMaterial.reason,
        failureClassification: protectedMaterial.missing ? "RECONSTRUCTION_DEFECT" : "UNRESOLVED"
      });
    }
    if (protectedMaterial.digest !== S12_TRACK_A_FIXTURE.protectedMaterialDigest) {
      return finishVerification({
        outcome: "NOT_QUALIFIED",
        criterion: "NOT_SATISFIED",
        verifierIntegrity: "FAILED",
        startingIdentity: startingBytesProof.startingIdentity,
        protectedMaterialDigest: protectedMaterial.digest,
        failure: "PROTECTED_MATERIAL_INTEGRITY_FAILURE",
        failureClassification: "RECONSTRUCTION_DEFECT"
      });
    }

    const source = await readSubjectSource(workspaceRoot);
    if (!source.ok) {
      return finishVerification({
        outcome: source.missing ? "MISSING" : "NOT_QUALIFIED",
        criterion: source.missing ? "UNVERIFIABLE" : "NOT_SATISFIED",
        verifierIntegrity: "VERIFIED",
        startingIdentity: startingBytesProof.startingIdentity,
        protectedMaterialDigest: protectedMaterial.digest,
        failure: source.reason,
        failureClassification: source.missing ? "RECONSTRUCTION_DEFECT" : "UNRESOLVED"
      });
    }
    const finalSourceDigest = computeSha256(source.bytes);
    if (!source.bytes.equals(Buffer.from(FINAL_SOURCE, "utf8"))) {
      return finishVerification({
        outcome: "NOT_QUALIFIED",
        criterion: "NOT_SATISFIED",
        verifierIntegrity: "VERIFIED",
        startingIdentity: startingBytesProof.startingIdentity,
        protectedMaterialDigest: protectedMaterial.digest,
        finalSourceDigest,
        failure: "FINAL_SOURCE_DID_NOT_MATCH_BETA",
        failureClassification: "RECONSTRUCTION_DEFECT"
      });
    }

    const testCommand = "node --test verifier/final-state.test.mjs";
    try {
      const test = await execFileAsync(
        process.execPath,
        ["--test", "verifier/final-state.test.mjs"],
        { cwd: workspaceRoot, timeout: 30_000, maxBuffer: 1024 * 1024, windowsHide: true }
      );
      return finishVerification({
        outcome: "QUALIFIED",
        criterion: "SATISFIED",
        verifierIntegrity: "VERIFIED",
        startingIdentity: startingBytesProof.startingIdentity,
        protectedMaterialDigest: protectedMaterial.digest,
        finalSourceDigest,
        testCommand,
        testExitCode: 0,
        testStdoutDigest: computeSha256(test.stdout),
        testStderrDigest: computeSha256(test.stderr),
        failureClassification: undefined
      });
    } catch (error) {
      const detail = error as {
        code?: unknown;
        killed?: unknown;
        signal?: unknown;
        stdout?: unknown;
        stderr?: unknown;
      };
      const environmentFailure =
        typeof detail.code === "string" && ["ENOENT", "EACCES", "EPERM"].includes(detail.code);
      const exitCode = typeof detail.code === "number" ? detail.code : undefined;
      return finishVerification({
        outcome: environmentFailure || detail.killed || detail.signal ? "MISSING" : "NOT_QUALIFIED",
        criterion:
          environmentFailure || detail.killed || detail.signal ? "UNVERIFIABLE" : "NOT_SATISFIED",
        verifierIntegrity: "VERIFIED",
        startingIdentity: startingBytesProof.startingIdentity,
        protectedMaterialDigest: protectedMaterial.digest,
        finalSourceDigest,
        testCommand,
        ...(exitCode === undefined ? {} : { testExitCode: exitCode }),
        ...(typeof detail.stdout === "string"
          ? { testStdoutDigest: computeSha256(detail.stdout) }
          : {}),
        ...(typeof detail.stderr === "string"
          ? { testStderrDigest: computeSha256(detail.stderr) }
          : {}),
        failure: environmentFailure
          ? "VERIFIER_RUNTIME_UNAVAILABLE"
          : "FROZEN_FINAL_STATE_TEST_FAILED",
        failureClassification:
          environmentFailure || detail.killed || detail.signal
            ? "ENVIRONMENT_BLOCK"
            : "RECONSTRUCTION_DEFECT"
      });
    }
  }
}

function finishVerification(
  input: Omit<
    S12TrackAVerification,
    "verifierId" | "verifierVersion" | "authority" | "scientificAuthority" | "verificationDigest"
  >
): S12TrackAVerification {
  const material = {
    verifierId: "s12_track_a_final_state_verifier" as const,
    verifierVersion: "0.1.0" as const,
    ...input,
    authority: "INTERNAL_CONSISTENCY_ONLY" as const,
    scientificAuthority: "NONE" as const
  };
  return { ...material, verificationDigest: computeSha256(canonicalJson(material)) };
}

function isVerifiedStartingBytes(value: unknown): value is VerifiedStartingBytes {
  return (
    value !== null &&
    typeof value === "object" &&
    verifiedSourceProofs.has(value) &&
    (value as VerifiedStartingBytes)[SOURCE_PROOF] === true
  );
}

async function digestFiles(root: string, files: readonly string[]): Promise<StartingRead> {
  const rootPath = path.resolve(root);
  const rootRealPath = await realpath(rootPath).catch(() => undefined);
  if (!rootRealPath) return { ok: false, missing: true, reason: "WORKSPACE_MISSING" };
  const fileDigests: FileDigest[] = [];
  for (const relative of files) {
    const target = path.resolve(rootRealPath, ...relative.split("/"));
    const rel = path.relative(rootRealPath, target);
    if (rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel))
      return { ok: false, missing: false, reason: "FIXED_MATERIAL_PATH_ESCAPE" };
    try {
      const info = await lstat(target);
      const actualPath = await realpath(target);
      const actualRel = path.relative(rootRealPath, actualPath);
      if (
        !info.isFile() ||
        info.isSymbolicLink() ||
        actualRel === ".." ||
        actualRel.startsWith(`..${path.sep}`) ||
        path.isAbsolute(actualRel)
      )
        return { ok: false, missing: false, reason: "FIXED_MATERIAL_NOT_REGULAR_FILE" };
      const bytes = await readFile(target);
      fileDigests.push({ path: relative, sha256: computeSha256(bytes) });
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      return {
        ok: false,
        missing: code === "ENOENT" || code === "ENOTDIR",
        reason:
          code === "ENOENT" || code === "ENOTDIR"
            ? `MISSING:${relative}`
            : `READ_FAILED:${relative}`
      };
    }
  }
  const material = { domain: "S12_TRACK_A_FILE_BYTES_SHA256_V1", files: fileDigests };
  return { ok: true, digest: computeSha256(canonicalJson(material)), fileDigests };
}

async function readManifest(root: string): Promise<Record<string, unknown> | undefined> {
  try {
    return JSON.parse(await readFile(path.join(root, "fixture-manifest.json"), "utf8")) as Record<
      string,
      unknown
    >;
  } catch {
    return undefined;
  }
}

async function readSubjectSource(
  root: string
): Promise<
  | { readonly ok: true; readonly bytes: Buffer }
  | { readonly ok: false; readonly missing: boolean; readonly reason: string }
> {
  const target = path.join(root, S12_TRACK_A_FIXTURE.taskSourcePath);
  try {
    const info = await lstat(target);
    const actual = await realpath(target);
    const rootReal = await realpath(root);
    const rel = path.relative(rootReal, actual);
    if (!info.isFile() || info.isSymbolicLink() || rel === ".." || rel.startsWith(`..${path.sep}`))
      return { ok: false, missing: false, reason: "SUBJECT_SOURCE_PATH_INVALID" };
    return { ok: true, bytes: await readFile(target) };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return {
      ok: false,
      missing: code === "ENOENT" || code === "ENOTDIR",
      reason:
        code === "ENOENT" || code === "ENOTDIR"
          ? "SUBJECT_SOURCE_MISSING"
          : "SUBJECT_SOURCE_READ_FAILED"
    };
  }
}

/** Issues an unforgeable in-process proof only after hashing the materialized starting bytes. */
async function establishVerifiedStartingBytes(
  workspaceRoot: string,
  callerClaimedDigest?: string
): Promise<{
  readonly proof?: VerifiedStartingBytes;
  readonly identity: Awaited<ReturnType<typeof verifyS12TrackAStartingFixture>>;
}> {
  const identity = await verifyS12TrackAStartingFixture(workspaceRoot, callerClaimedDigest);
  if (identity.outcome !== "QUALIFIED") return { identity };
  const proof = Object.freeze({
    [SOURCE_PROOF]: true as const,
    startingIdentity: identity.actualStartingIdentity!,
    protectedMaterialDigest: identity.actualProtectedMaterialDigest!
  });
  verifiedSourceProofs.add(proof);
  return { proof, identity };
}

export async function runS12TrackAQualification(input: {
  readonly workspaceRoot: string;
  readonly witness?: S12TrackAWitness;
  readonly callerClaimedDigest?: string;
  readonly diagnosticText?: string;
}): Promise<S12TrackAQualificationResult> {
  const witness = input.witness ?? "WRITE_BETA";
  const starting = await establishVerifiedStartingBytes(
    input.workspaceRoot,
    input.callerClaimedDigest
  );
  if (!starting.proof) return { outcome: starting.identity.outcome };

  const scripted = new TrackAScriptedTransport(witness);
  const adapter = new OpenRouterSubjectAdapter(scripted, () => "scripted-no-network");
  const operations = nodeToolOperations();
  const root = path.resolve(input.workspaceRoot);
  const boundedOperations = {
    ...operations,
    writeFile: async (target: string, content: string) => {
      if (path.resolve(target) !== path.resolve(root, S12_TRACK_A_FIXTURE.taskSourcePath))
        throw new Error("TRACK_A_WRITE_SCOPE_VIOLATION");
      await operations.writeFile(target, content);
    },
    runCommand: async () => {
      throw new Error("TRACK_A_COMMANDS_DISABLED");
    }
  };
  const diagnostics = input.diagnosticText
    ? new S12CommandDiagnosticSidecarBuilder({
        projector: (({ stream }) => stream) as S12DiagnosticProjector
      })
    : undefined;
  if (diagnostics && input.diagnosticText) {
    diagnostics.captureCompleted({
      runId: "scripted-run",
      attemptId: "scripted-attempt",
      toolCallId: "diagnostic-only",
      stdout: input.diagnosticText,
      stderr: ""
    });
  }
  const verifier = new S12TrackAFinalStateVerifier();
  let lastVerification: S12TrackAVerification | undefined;
  let capture: S12ExecutionCapture | undefined;
  let repeatabilityProjection: S12TrackARepeatabilityProjection | undefined;
  let s05Projection: S12TrackAS05Projection | undefined;
  let s09: S12TrackAS09Lineage | undefined;
  const evidenceSystem = new EvidenceSystem();
  const environmentManifest = createTrackAEnvironmentManifest(evidenceSystem);
  const evidenceVerifier = new EvidenceVerifier();
  const runner = new S12QualificationRunner(
    adapter,
    new S12LocalToolExecutor(boundedOperations),
    {
      verifyFinalState: async () => {
        lastVerification = await verifier.verify(input.workspaceRoot, starting.proof);
        return lastVerification;
      },
      evaluate: async (events) => {
        capture = createS12ExecutionCaptureFromEvents(
          events,
          starting.identity.actualStartingIdentity!,
          environmentManifest.environmentDigest,
          s12ProspectiveConfigDigest(S12_EXECUTION_STRATA.S12_10_TURNS)
        );
        const material = repeatabilityMaterial(capture, lastVerification);
        repeatabilityProjection = {
          type: "TRACK_A_REPEATABILITY_PROJECTION",
          material,
          digest: computeSha256(canonicalJson(material))
        };
        s05Projection = createS05Projection(
          [repeatabilityProjection],
          [`capture:${executionCaptureDigest(capture)}`]
        );
        return repeatabilityProjection;
      },
      packageEvidence: async ({ runId, attemptId, verification }) => {
        const executionRunId = typeof runId === "string" ? runId : "";
        const executionAttemptId = typeof attemptId === "string" ? attemptId : "";
        const captureDigest = capture ? executionCaptureDigest(capture) : "";
        const captureReference = `capture:${captureDigest}`;
        const packageId = `evidence:${executionRunId}`;
        try {
          if (!executionRunId || !executionAttemptId)
            throw new Error("GOVERNED_EXECUTION_IDENTITY_MISSING");
          if (!capture) throw new Error("GOVERNED_CAPTURE_MISSING");
          const packageInput = createTrackAS09EvidencePackage({
            packageId,
            runId: executionRunId,
            attemptId: executionAttemptId,
            capture,
            verification: verification as S12TrackAVerification,
            environmentManifest
          });
          const evidencePackage = evidenceSystem.createEvidencePackage(packageInput);
          const verificationResult = evidenceVerifier.verify(evidencePackage);
          s09 = {
            packageId: evidencePackage.packageId,
            packageDigest: evidencePackage.packageDigest,
            captureReference,
            captureDigest,
            internalVerification: verificationResult.outcome,
            verification: verificationResult,
            evidencePackage,
            authority: verificationResult.authority,
            scientificAuthority: verificationResult.scientificAuthority
          };
        } catch (error) {
          s09 = {
            packageId,
            captureReference,
            captureDigest,
            internalVerification: "NOT_ASSESSED",
            failure: error instanceof Error ? error.name : "S09_PACKAGE_UNAVAILABLE",
            authority: "INTERNAL_CONSISTENCY_ONLY",
            scientificAuthority: "NONE"
          };
        }
        return s09;
      }
    },
    () => "2026-01-01T00:00:00.000Z",
    (() => {
      let id = 0;
      const executionId = ++trackAExecutionSequence;
      return () => `track-a-${executionId}-${++id}`;
    })(),
    S12_EXECUTION_STRATA.S12_10_TURNS,
    (() => {
      let tick = 0;
      return () => ++tick;
    })(),
    diagnostics
  );
  let qualification = await runner.run({
    mode: "DRY_RUN",
    workspaceRoot: input.workspaceRoot,
    fixtureDigest: starting.identity.actualStartingIdentity!,
    messages: [
      { role: "system", content: "Synthetic deterministic pipeline qualification; no network." },
      {
        role: "user",
        content: "Change getMessage() from alpha to beta. Do not edit protected material."
      }
    ]
  });
  const verification = qualification.verification as S12TrackAVerification | undefined;
  const outcome = combineS12TrackAQualificationOutcome(
    verification?.outcome ?? "NOT_QUALIFIED",
    s09?.internalVerification ?? "NOT_ASSESSED"
  );
  if (verification?.outcome === "QUALIFIED" && outcome !== "QUALIFIED") {
    qualification = {
      ...qualification,
      terminalStatus: "INSTRUMENTATION_FAILURE",
      structuredFailure: {
        code: "S09_INTERNAL_VERIFICATION_REQUIRED",
        detail: "Canonical S-09 internal-consistency verification did not succeed."
      }
    };
  }
  const captureDigest = capture ? executionCaptureDigest(capture) : undefined;
  const result: S12TrackAQualificationResult = {
    outcome,
    startingIdentity: starting.identity.actualStartingIdentity,
    protectedMaterialDigest: starting.identity.actualProtectedMaterialDigest,
    qualification,
    ...(verification ? { verification } : {}),
    ...(capture ? { capture, captureDigest } : {}),
    ...(repeatabilityProjection ? { repeatabilityProjection } : {}),
    ...(s05Projection ? { s05Projection } : {}),
    ...(s09 ? { s09 } : {}),
    ...(diagnostics?.build() ? { diagnosticSidecar: diagnostics.build() } : {})
  };
  if (capture && repeatabilityProjection && verification) {
    trackAResultProofs.set(result, { capture, projection: repeatabilityProjection, verification });
  }
  return result;
}

function createTrackAEnvironmentManifest(system: EvidenceSystem): EnvironmentManifest {
  const known = <T>(value: T): EvidenceValue<T> => ({
    state: "KNOWN",
    value,
    evidenceReferences: ["s12:track-a-wrapper"]
  });
  const notApplicable = (reason: string): EvidenceValue<never> => ({
    state: "NOT_APPLICABLE",
    reason
  });
  return system.createEnvironmentManifest({
    environmentId: "environment:s12-track-a-scripted",
    environmentVersion: "0.1.0",
    schemaVersion: "1.0.0",
    platform: known(process.platform),
    architecture: known(process.arch),
    runtime: known("node"),
    runtimeVersion: known(process.version),
    containerImageDigest: notApplicable("No container image is used by this synthetic fixture."),
    hardwareClass: known("local"),
    acceleratorClass: notApplicable("No accelerator is used."),
    locale: known("C"),
    timezonePolicy: known("UTC"),
    environmentVariables: { classification: "NOT_CAPTURED", names: [] },
    dependencies: [],
    dependencyCompleteness: "UNKNOWN",
    networkDependency: "NO_NETWORK",
    toolAvailability: ["node", "scripted-s12-subject-transport"],
    completeness: "PARTIALLY_CAPTURED",
    limitations: ["Synthetic local Track-A execution; no live provider state is represented."],
    scientificAuthority: "NONE"
  });
}

function createTrackAS09EvidencePackage(input: {
  readonly packageId: string;
  readonly runId: string;
  readonly attemptId: string;
  readonly capture: S12ExecutionCapture;
  readonly verification: S12TrackAVerification;
  readonly environmentManifest: EnvironmentManifest;
}): EvidencePackageInput {
  const { capture, verification, environmentManifest } = input;
  if (
    capture.runId !== input.runId ||
    capture.attemptId !== input.attemptId ||
    capture.environmentDigest !== environmentManifest.environmentDigest
  )
    throw new Error("TRACK_A_S09_EXECUTION_LINEAGE_MISMATCH");

  const known = <T>(value: T): EvidenceValue<T> => ({
    state: "KNOWN",
    value,
    evidenceReferences: ["s12:track-a-wrapper"]
  });
  const unknown = (reason: string): EvidenceValue<never> => ({ state: "UNKNOWN", reason });
  const notApplicable = <T>(reason: string): EvidenceValue<T> => ({
    state: "NOT_APPLICABLE",
    reason
  });
  const captureDigest = executionCaptureDigest(capture);
  const captureReference = `capture:${captureDigest}`;
  const fixtureReference = `fixture:${capture.fixtureDigest}`;
  const verifierReference = `verifier:${verification.verificationDigest}`;
  const resultReference = `result:${input.runId}`;
  const configurationReference = `configuration:${capture.configDigest}`;
  const digest = (value: unknown) => ({
    algorithm: "SHA_256" as const,
    value: computeSha256(canonicalJson(value)),
    canonicalizationProfile: "semantiq-canonical-json-v1" as const
  });
  const record = (
    referenceId: string,
    scope: "EXECUTION_S09" | "OTHER" | "RESULT",
    recordId: string,
    value: unknown,
    provenanceReferences: readonly string[]
  ) => ({
    referenceId,
    scope,
    recordId,
    recordVersion: "0.1.0",
    semanticDigest: digest(value),
    availability: "REFERENCED" as const,
    provenanceReferences
  });
  const artifact = (
    artifactId: string,
    kind: ArtifactReference["kind"],
    value: unknown,
    provenanceReferences: readonly string[]
  ): ArtifactReference => {
    const contentDigest = {
      algorithm: "SHA_256" as const,
      value: computeSha256(canonicalJson(value)),
      representation: "CANONICAL_JSON" as const
    };
    return {
      artifactId,
      artifactVersion: "0.1.0",
      kind,
      contentDigest,
      observedContentDigest: contentDigest,
      mediaType: "application/json",
      availability: "REFERENCED",
      locationClass: "NOT_DISCLOSED",
      rightsStatus: "UNKNOWN_RIGHTS",
      provenanceReferences,
      limitations: ["S-09 retains the canonical digest; source bytes are not embedded."]
    };
  };
  const resultMaterial = {
    runId: input.runId,
    attemptId: input.attemptId,
    captureDigest,
    verificationDigest: verification.verificationDigest,
    outcome: verification.outcome,
    authority: "INTERNAL_CONSISTENCY_ONLY",
    scientificAuthority: "NONE"
  };
  const randomization = {
    policy: notApplicable<string>("No stochastic model inference occurs in the scripted fixture."),
    algorithm: notApplicable<string>("No randomization algorithm is used."),
    seed: notApplicable<number>("No randomization seed is used."),
    scope: notApplicable<string>("No randomization scope applies."),
    implementationVersion: notApplicable<string>("No randomization implementation applies.")
  };
  const conditions = {
    configurationReference: known(configurationReference),
    configurationDigest: known(capture.configDigest),
    language: known("en"),
    toolPolicy: known("S12_BOUNDED_LOCAL_TOOLS"),
    model: unknown("The scripted transport is not a model identity or provider observation."),
    modelEvidenceStatuses: [],
    samplingConfigurationReference: notApplicable<string>("No sampling is performed."),
    randomization
  };
  const sourceRevision = {
    gitCommit: unknown("Source revision is not part of the Track-A capture contract."),
    gitTree: unknown("Source tree is not part of the Track-A capture contract."),
    packageVersion: unknown("Package version is not captured by the fixture."),
    schemaVersions: [{ schemaId: "s12-track-a-capture", schemaVersion: "1.0.0" }]
  };
  const execution = new EvidenceSystem().createExecutionManifest({
    manifestId: `manifest:${input.runId}`,
    manifestVersion: "0.1.0",
    schemaVersion: "1.0.0",
    executionId: input.attemptId,
    executionStatus: "SUCCEEDED",
    targetReference: resultReference,
    benchmarkIdentity: unknown(
      "Track A is a synthetic engineering fixture, not a registered benchmark claim."
    ),
    itemIdentity: known({
      itemId: S12_TRACK_A_FIXTURE.scenarioId,
      itemVersion: S12_TRACK_A_FIXTURE.version
    }),
    constructReference: unknown("No scientific construct is claimed."),
    metricIdentity: unknown("No scientific metric is claimed."),
    evaluatorIdentity: unknown("No registered scientific evaluator is claimed."),
    studyProtocolReference: known("S12_TRACK_A_SYNTHETIC_PIPELINE_QUALIFICATION"),
    comparisonDefinitionReference: notApplicable(
      "This package records one execution, not a comparison."
    ),
    intended: conditions,
    observed: conditions,
    environmentDigest: environmentManifest.environmentDigest,
    sourceRevision,
    inputArtifactIds: [fixtureReference],
    expectedOutputArtifactIds: [resultReference],
    observedOutputArtifactIds: [resultReference],
    evidenceReferences: [
      fixtureReference,
      captureReference,
      verifierReference,
      configurationReference
    ],
    scientificAuthority: "NONE"
  });
  const completeness = EVIDENCE_COMPLETENESS_DIMENSIONS.map((dimension) => {
    const status: EvidenceCompletenessStatus = [
      "VALIDITY",
      "HUMAN_PROTOCOL",
      "COMPARABILITY",
      "METRIC",
      "EVALUATOR"
    ].includes(dimension)
      ? "NOT_APPLICABLE"
      : ["DEPENDENCIES", "RELIABILITY"].includes(dimension)
        ? "UNKNOWN"
        : dimension === "ENVIRONMENT"
          ? "PARTIAL"
          : "COMPLETE";
    return {
      dimension,
      status,
      critical: [
        "IDENTITY",
        "INPUT",
        "CONFIGURATION",
        "EXECUTION",
        "OUTPUT",
        "PROVENANCE"
      ].includes(dimension),
      evidenceReferences: [captureReference, verifierReference],
      rationale:
        status === "NOT_APPLICABLE"
          ? "Track A makes no scientific or human-study claim."
          : status === "UNKNOWN"
            ? "This dimension is not established by the synthetic execution."
            : status === "PARTIAL"
              ? "Only the local scripted execution environment is captured."
              : "Bound to the synthetic Track-A execution evidence."
    };
  });
  const packageInput: EvidencePackageInput = {
    packageId: input.packageId,
    packageVersion: "0.1.0",
    schemaVersion: "1.0.0",
    packageMode: "REFERENTIAL",
    target: {
      referenceId: resultReference,
      scope: "RESULT",
      claimOrResultType: "S12_TRACK_A_SYNTHETIC_PIPELINE_QUALIFICATION"
    },
    records: [
      record(
        fixtureReference,
        "OTHER",
        "s12_track_a_fixture",
        { fixtureDigest: capture.fixtureDigest },
        [captureReference]
      ),
      record(captureReference, "EXECUTION_S09", "s12_track_a_execution_capture", capture, [
        input.attemptId
      ]),
      record(verifierReference, "OTHER", "s12_track_a_final_state_verifier", verification, [
        captureReference
      ]),
      record(resultReference, "RESULT", "s12_track_a_qualification_result", resultMaterial, [
        input.attemptId
      ])
    ],
    requirements: [
      {
        requirementId: "fixture",
        purpose: "ENGINEERING_CONFORMANCE",
        referenceId: fixtureReference,
        critical: true
      },
      {
        requirementId: "capture",
        purpose: "ENGINEERING_CONFORMANCE",
        referenceId: captureReference,
        critical: true
      },
      {
        requirementId: "final-state-verifier",
        purpose: "ENGINEERING_CONFORMANCE",
        referenceId: verifierReference,
        critical: true
      },
      {
        requirementId: "result",
        purpose: "ENGINEERING_CONFORMANCE",
        referenceId: resultReference,
        critical: true
      }
    ],
    artifacts: [
      artifact(fixtureReference, "FIXTURE", { fixtureDigest: capture.fixtureDigest }, [
        captureReference
      ]),
      artifact(captureReference, "TRACE", capture, [input.attemptId]),
      artifact(verifierReference, "REPORT", verification, [captureReference]),
      artifact(resultReference, "REPORT", resultMaterial, [input.attemptId])
    ],
    executionManifest: execution,
    environmentManifest,
    completeness,
    chain: [
      {
        fromReference: fixtureReference,
        relationship: "USED_INPUT",
        toReference: captureReference
      },
      {
        fromReference: captureReference,
        relationship: "EXECUTED_AS",
        toReference: input.attemptId
      },
      { fromReference: input.attemptId, relationship: "PRODUCED", toReference: resultReference },
      {
        fromReference: resultReference,
        relationship: "SUPPORTED_BY",
        toReference: verifierReference
      }
    ],
    determinismClass: "UNKNOWN",
    evaluatorDeterminism: notApplicable("No scientific evaluator determinism is asserted."),
    reproducibilityStatus: "NOT_ASSESSED",
    signatureStatus: "NOT_IMPLEMENTED",
    limitations: [
      "S-09 verification establishes internal package consistency only.",
      "The synthetic execution makes no scientific or model-capability claim."
    ],
    scientificAuthority: "NONE"
  };
  return packageInput;
}

function createS05Projection(
  projections: readonly S12TrackARepeatabilityProjection[],
  evidenceReferences: readonly string[]
): S12TrackAS05Projection {
  const comparedProjectionDigests = projections.map(({ digest }) => digest);
  const canonical = mapExactRepeatabilityToS05(comparedProjectionDigests, evidenceReferences);
  return {
    scope: "RELIABILITY_S05",
    studyId: "s12_track_a_pipeline_qualification_repeatability",
    method: "EXACT_REPEATABILITY",
    comparedProjectionDigests,
    exactMatch:
      comparedProjectionDigests.length > 1 &&
      comparedProjectionDigests.every((digest) => digest === comparedProjectionDigests[0]),
    canonicalSemanticDigest: canonical.current.semanticDigest,
    authority: "INTERNAL_CONSISTENCY_ONLY",
    scientificAuthority: "NONE"
  };
}

class TrackAScriptedTransport implements OpenRouterTransport {
  private generation = 0;
  constructor(private readonly witness: S12TrackAWitness) {}

  async listModels(): Promise<readonly OpenRouterModelMetadata[]> {
    return [
      {
        id: S12_SUBJECT.modelId,
        pricing: { prompt: "0", completion: "0" },
        supportedParameters: ["tools", "tool_choice", "temperature", "top_p", "max_tokens", "seed"]
      } as OpenRouterModelMetadata
    ];
  }

  async listEndpoints(): Promise<readonly OpenRouterEndpointMetadata[]> {
    return [
      {
        name: `${S12_SUBJECT.upstreamProvider} | ${S12_SUBJECT.upstreamModelId}`,
        modelId: S12_SUBJECT.modelId,
        providerName: S12_SUBJECT.upstreamProvider,
        tag: S12_SUBJECT.endpointTag,
        pricing: { prompt: "0", completion: "0" },
        supportedParameters: ["tools", "tool_choice", "temperature", "top_p", "max_tokens", "seed"]
      }
    ];
  }

  async generate(): Promise<OpenRouterGenerationResponse> {
    this.generation++;
    const value = this.witness === "WRITE_WRONG_VALUE" ? "gamma" : "beta";
    const shouldWrite =
      this.generation === 1 && ["WRITE_BETA", "WRITE_WRONG_VALUE"].includes(this.witness);
    const toolCalls = shouldWrite
      ? [
          {
            id: "track-a-write",
            name: "write_file",
            arguments: {
              path: S12_TRACK_A_FIXTURE.taskSourcePath,
              content: `export function getMessage() {\n  return "${value}";\n}\n`
            }
          }
        ]
      : [];
    return {
      responseId: `scripted-${this.generation}`,
      model: S12_SUBJECT.modelId,
      provider: S12_SUBJECT.upstreamProvider,
      message: {
        role: "assistant",
        content:
          this.witness === "MISLEADING_TRACE"
            ? "QUALIFIED final state assured"
            : "scripted deterministic response"
      },
      toolCalls,
      usage: { inputTokens: 0, outputTokens: 0, reportedCostUsd: 0 }
    };
  }
}

function repeatabilityMaterial(
  capture: S12ExecutionCapture,
  verification?: S12TrackAVerification
): Readonly<Record<string, unknown>> {
  return {
    subjectId: capture.subjectId,
    modelId: capture.modelId,
    upstreamModel: capture.upstreamModel,
    upstreamProvider: capture.upstreamProvider,
    configDigest: capture.configDigest,
    fixtureDigest: capture.fixtureDigest,
    environmentDigest: capture.environmentDigest,
    modelTurns: capture.modelTurns.map(({ sequence, role, contentDigest }) => ({
      sequence,
      role,
      contentDigest
    })),
    toolCalls: capture.toolCalls.map(
      ({ sequence, name, arguments: args, result, exitStatus, provenance }) => ({
        sequence,
        name,
        arguments: args,
        result,
        exitStatus,
        provenance
      })
    ),
    artifactMutations: capture.artifactMutations,
    terminalStatus: capture.terminalStatus,
    missingness: capture.missingness,
    verification: verification
      ? {
          outcome: verification.outcome,
          criterion: verification.criterion,
          verifierIntegrity: verification.verifierIntegrity,
          startingIdentity: verification.startingIdentity,
          protectedMaterialDigest: verification.protectedMaterialDigest,
          finalSourceDigest: verification.finalSourceDigest,
          testExitCode: verification.testExitCode,
          failure: verification.failure
        }
      : undefined
  };
}
