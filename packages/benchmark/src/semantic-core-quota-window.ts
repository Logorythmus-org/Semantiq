import { open, readFile, readdir, unlink, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { semanticCoreDigest, assertSemanticCoreFreeRoute } from "./semantic-core-openrouter.js";
import {
  runSemanticCoreQualification,
  prepareSemanticCoreQualification,
  semanticCoreCaptureDigest,
  evaluateSemanticCoreObservation
} from "./semantic-core-qualification.js";
import { semanticCoreMetricsFor } from "./semantic-core.js";
import {
  SEMANTIC_CORE_QUOTA_WINDOW_PROTOCOL,
  SemanticCoreQualificationError
} from "./semantic-core-qualification-types.js";
import type { SemanticCoreQualificationCapture } from "./semantic-core-qualification.js";
import type {
  SemanticCoreQualificationSubject,
  SemanticCoreSubjectConfiguration,
  SemanticCoreFreeCapacity
} from "./semantic-core-qualification-types.js";

const fail = (): never => {
  throw new SemanticCoreQualificationError("CAPTURE_INTEGRITY_FAILURE");
};
export const SEMANTIC_CORE_SELECTED_SUBJECT: SemanticCoreSubjectConfiguration = {
  provider: "OpenRouter",
  modelId: "apodex/apodex-1.1-mini:free",
  providerName: "Novita",
  route: "novita/bf16",
  snapshotStatus: "MUTABLE_ALIAS",
  temperature: 0,
  maxTokens: 128,
  responseFormat: "STRICT_JSON_SCHEMA"
};
export const SEMANTIC_CORE_SELECTED_CANONICAL_SLUG = "apodex/apodex-1.1-mini-20261001";
async function durable(path: string, data: string, flags = "wx") {
  const handle = await open(path, flags);
  try {
    await handle.writeFile(data, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
}
export interface SemanticCoreRunCheckpoint {
  protocol: typeof SEMANTIC_CORE_QUOTA_WINDOW_PROTOCOL;
  conditionDigest: string;
  run: number;
  scheduledAttempts: 24;
  terminalAttempts: 24;
  providerPreflightDigest: string;
  capacity: SemanticCoreFreeCapacity;
  captureDigest: string;
  source: { gitCommit: string; gitTree: string };
  executedAt: string;
  capture: SemanticCoreQualificationCapture;
}
/** Validate every old terminal and metric, not just a caller-supplied checksum. */
export async function validateSemanticCoreCheckpoint(
  packRoot: string,
  checkpoint: SemanticCoreRunCheckpoint
) {
  const { capture, run } = checkpoint;
  if (
    !Number.isInteger(run) ||
    run < 1 ||
    run > 3 ||
    checkpoint.scheduledAttempts !== 24 ||
    checkpoint.terminalAttempts !== 24 ||
    semanticCoreDigest(checkpoint.protocol) !==
      semanticCoreDigest(SEMANTIC_CORE_QUOTA_WINDOW_PROTOCOL) ||
    capture.conditionDigest !== checkpoint.conditionDigest ||
    semanticCoreDigest(capture.condition) !== checkpoint.conditionDigest ||
    semanticCoreCaptureDigest(capture) !== checkpoint.captureDigest ||
    capture.attempts.length !== run * 24 ||
    capture.runs.length !== run ||
    checkpoint.providerPreflightDigest !== semanticCoreDigest(capture.condition.providerMetadata) ||
    checkpoint.capacity.remaining < 24 ||
    semanticCoreDigest(capture.condition.protocol) !==
      semanticCoreDigest(SEMANTIC_CORE_QUOTA_WINDOW_PROTOCOL) ||
    semanticCoreDigest(checkpoint.source) !== semanticCoreDigest(capture.condition.source)
  )
    fail();
  const prepared = await prepareSemanticCoreQualification(
    packRoot,
    capture.condition.source,
    capture.condition.subjectConfiguration ?? undefined,
    "0.1.1"
  );
  const { providerMetadata: _metadata, evidenceOrigin: _origin, ...frozen } = capture.condition;
  if (semanticCoreDigest(prepared.frozen) !== semanticCoreDigest(frozen)) fail();
  const ids = new Set<string>();
  for (const [index, attempt] of capture.attempts.entries()) {
    const expectedRun = Math.floor(index / 24) + 1;
    const item = prepared.items[index % 24]!;
    if (
      attempt.run !== expectedRun ||
      attempt.caseId !== item.caseId ||
      attempt.attemptId !== `semantic-core-run-${expectedRun}-${item.caseId}` ||
      ids.has(attempt.attemptId) ||
      attempt.promptDigest !== prepared.frozen.prompts[index % 24]!.promptDigest
    )
      fail();
    ids.add(attempt.attemptId);
    const evaluated = evaluateSemanticCoreObservation(item, attempt.observation);
    if (
      semanticCoreDigest(evaluated) !== attempt.evaluationDigest ||
      semanticCoreDigest(attempt.evaluation) !== attempt.evaluationDigest ||
      attempt.replayDigest !== attempt.evaluationDigest ||
      !attempt.replayExact
    )
      fail();
  }
  for (let number = 1; number <= run; number++) {
    const entry = capture.runs[number - 1]!;
    const attempts = capture.attempts.filter((a) => a.run === number);
    if (
      entry.run !== number ||
      entry.accounted !== 24 ||
      attempts.length !== 24 ||
      semanticCoreDigest(entry.metrics) !==
        semanticCoreDigest(
          semanticCoreMetricsFor(
            attempts.map((a) => a.evaluation),
            capture.condition.packDigest
          )
        )
    )
      fail();
  }
}
type FrozenFile = {
  condition: SemanticCoreQualificationCapture["condition"];
  conditionDigest: string;
  openedAt: string;
  deadline: string;
};

/** A crashed journal/lock is never retried: operators retain incomplete evidence for inspection. */
export async function executeSemanticCoreQuotaRun(options: {
  directory: string;
  resume: boolean;
  run: number;
  packRoot: string;
  source: { gitCommit: string; gitTree: string };
  subject: SemanticCoreQualificationSubject;
  authorizeLive: boolean;
  repositoryValidation?: { sourceCommit: string; reportDigest: string; status: "PASSED" };
  onAttempt?: Parameters<typeof runSemanticCoreQualification>[0]["onAttempt"];
  requestIntervalMs?: number;
}) {
  if (!options.authorizeLive || ![1, 2, 3].includes(options.run) || !options.subject.capacity)
    throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
  if (!options.resume && options.run !== 1) fail();
  if (!options.resume) await mkdir(options.directory, { recursive: false });
  const lock = join(options.directory, "active.lock");
  await durable(lock, "active\n");
  let runStarted = false;
  let checkpointWritten = false;
  try {
    const files = await readdir(options.directory);
    const allowed = new Set([
      "active.lock",
      "condition.json",
      "qualification.json",
      ...[1, 2, 3].flatMap((n) => [`run-${n}.json`, `run-${n}.attempts.jsonl`])
    ]);
    if (files.some((f) => !allowed.has(f))) fail();
    let previous: SemanticCoreQualificationCapture | undefined;
    let frozen: FrozenFile | undefined;
    if (files.includes("condition.json"))
      frozen = JSON.parse(await readFile(join(options.directory, "condition.json"), "utf8"));
    if (options.resume && !frozen) fail();
    for (let run = 1; run <= 3; run++) {
      const present = files.includes(`run-${run}.json`);
      const journal = files.includes(`run-${run}.attempts.jsonl`);
      if (present !== journal || present !== run < options.run) fail();
      if (!present) continue;
      const cp: SemanticCoreRunCheckpoint = JSON.parse(
        await readFile(join(options.directory, `run-${run}.json`), "utf8")
      );
      await validateSemanticCoreCheckpoint(options.packRoot, cp);
      if (
        cp.run !== run ||
        cp.conditionDigest !== frozen!.conditionDigest ||
        semanticCoreDigest(cp.capture.condition) !== semanticCoreDigest(frozen!.condition) ||
        (previous &&
          semanticCoreDigest(cp.capture.attempts.slice(0, previous.attempts.length)) !==
            semanticCoreDigest(previous.attempts))
      )
        fail();
      const lines = (await readFile(join(options.directory, `run-${run}.attempts.jsonl`), "utf8"))
        .trimEnd()
        .split("\n")
        .map((line) => JSON.parse(line));
      if (
        lines.length !== 24 ||
        semanticCoreDigest(lines) !==
          semanticCoreDigest(cp.capture.attempts.filter((a) => a.run === run))
      )
        fail();
      previous = cp.capture;
    }
    if (
      frozen &&
      (semanticCoreDigest(frozen.condition) !== frozen.conditionDigest ||
        semanticCoreDigest(options.source) !== semanticCoreDigest(frozen.condition.source) ||
        !Number.isFinite(Date.parse(frozen.openedAt)) ||
        Date.parse(frozen.deadline) - Date.parse(frozen.openedAt) !== 168 * 3600000 ||
        Date.now() > Date.parse(frozen.deadline))
    )
      fail();
    const priorCritical = previous?.attempts.find((a) =>
      [
        "IDENTITY_SUBSTITUTION",
        "PROVIDER_METADATA_MISMATCH",
        "ZERO_COST_POLICY_FAILURE",
        "CREDENTIAL_UNAVAILABLE",
        "PREFLIGHT_FAILURE"
      ].includes(a.observation.error ?? "")
    );
    if (priorCritical) throw new SemanticCoreQualificationError(priorCritical.observation.error!);
    const config = structuredClone(SEMANTIC_CORE_SELECTED_SUBJECT);
    const metadata = await options.subject.preflight(config);
    assertSemanticCoreFreeRoute(metadata, config);
    if (metadata.canonicalSlug !== SEMANTIC_CORE_SELECTED_CANONICAL_SLUG)
      throw new SemanticCoreQualificationError("PROVIDER_METADATA_MISMATCH");
    const prepared = await prepareSemanticCoreQualification(
      options.packRoot,
      options.source,
      config,
      "0.1.1"
    );
    const condition = {
      ...prepared.frozen,
      providerMetadata: metadata,
      evidenceOrigin: options.subject.evidenceOrigin
    };
    if (frozen && semanticCoreDigest(condition) !== frozen.conditionDigest)
      throw new SemanticCoreQualificationError("IDENTITY_SUBSTITUTION");
    const capacity = await options.subject.capacity();
    if (
      ![capacity.used, capacity.limit, capacity.remaining].every(
        (v) => Number.isSafeInteger(v) && v >= 0
      ) ||
      capacity.used + capacity.remaining !== capacity.limit ||
      !Number.isFinite(Date.parse(capacity.observedAt))
    )
      throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
    if (capacity.remaining < 24)
      return {
        collectionState: "AWAITING_NEXT_QUOTA_WINDOW" as const,
        outcome: "INSUFFICIENT_EVIDENCE" as const,
        accountedAttempts: previous?.attempts.length ?? 0,
        nextRun: options.run,
        capacity,
        providerMetadata: metadata
      };
    if (!frozen) {
      const openedAt = new Date().toISOString();
      frozen = {
        condition,
        conditionDigest: semanticCoreDigest(condition),
        openedAt,
        deadline: new Date(Date.parse(openedAt) + 168 * 3600000).toISOString()
      };
      await durable(
        join(options.directory, "condition.json"),
        JSON.stringify(frozen, null, 2) + "\n"
      );
    }
    const interval =
      options.subject.evidenceOrigin === "LIVE_PROVIDER" ? 3500 : (options.requestIntervalMs ?? 0);
    let lastStart = 0;
    const paced: SemanticCoreQualificationSubject = {
      evidenceOrigin: options.subject.evidenceOrigin,
      capacity: async () => capacity,
      preflight: (c) => options.subject.preflight(c),
      observe: async (input, c, context) => {
        const delay = interval - (Date.now() - lastStart);
        if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
        lastStart = Date.now();
        return options.subject.observe(input, c, context);
      }
    };
    // Exclusive journal creation before the first request. No replacement after a crash.
    const journal = join(options.directory, `run-${options.run}.attempts.jsonl`);
    await durable(journal, "");
    runStarted = true;
    const result = await runSemanticCoreQualification({
      packRoot: options.packRoot,
      source: options.source,
      configuration: config,
      mode: "live",
      authorizeLive: true,
      subject: paced,
      protocolVersion: "0.1.1",
      run: options.run,
      ...(previous ? { previous } : {}),
      providerMetadata: metadata,
      ...(options.repositoryValidation
        ? { repositoryValidation: options.repositoryValidation }
        : {}),
      onAttempt: async (attempt) => {
        await durable(journal, JSON.stringify(attempt) + "\n", "a");
        await options.onAttempt?.(attempt);
      }
    });
    if (result.mode === "DRY_RUN") throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
    const checkpoint: SemanticCoreRunCheckpoint = {
      protocol: SEMANTIC_CORE_QUOTA_WINDOW_PROTOCOL,
      conditionDigest: result.capture.conditionDigest,
      run: options.run,
      scheduledAttempts: 24,
      terminalAttempts: 24,
      providerPreflightDigest: semanticCoreDigest(metadata),
      capacity,
      captureDigest: result.captureDigest,
      source: options.source,
      executedAt: new Date().toISOString(),
      capture: result.capture
    };
    await validateSemanticCoreCheckpoint(options.packRoot, checkpoint);
    await durable(
      join(options.directory, `run-${options.run}.json`),
      JSON.stringify(checkpoint, null, 2) + "\n"
    );
    checkpointWritten = true;
    if (options.run === 3)
      await durable(
        join(options.directory, "qualification.json"),
        JSON.stringify(result, null, 2) + "\n"
      );
    return {
      collectionState: options.run === 3 ? ("COMPLETE" as const) : ("STAGED_COMPLETE_RUN" as const),
      outcome: result.mode === "LIVE" ? result.qualification.outcome : result.outcome,
      accountedAttempts: result.capture.attempts.length,
      nextRun: options.run + 1,
      capacity,
      result
    };
  } finally {
    if (!runStarted || checkpointWritten) await unlink(lock);
  }
}
