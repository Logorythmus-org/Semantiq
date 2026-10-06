import { open, readFile, readdir, mkdir, unlink, realpath, lstat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { SemanticCoreLocalTransport } from "./semantic-core-local-transport.js";
import { observeSemanticCoreLocal } from "./semantic-core-local-observation.js";
import { semanticCoreSubjectInput } from "./semantic-core-qualification.js";
import { semanticCoreDigest } from "./semantic-core-openrouter.js";
import {
  validateSemanticCoreLocalCondition,
  validateSemanticCoreLocalClearance,
  integrityFailure,
  identityFailure
} from "./semantic-core-local-condition.js";
import {
  makeSemanticCoreLocalAttempt,
  validateSemanticCoreLocalAttempt,
  summarizeSemanticCoreLocalRun,
  finalizeSemanticCoreLocalStudy
} from "./semantic-core-local-study.js";
import { SemanticCoreQualificationError } from "./semantic-core-qualification-types.js";
import type {
  SemanticCoreLocalFrozenFile,
  SemanticCoreLocalCondition
} from "./semantic-core-local-condition.js";
import type {
  SemanticCoreLocalAttempt,
  SemanticCoreLocalRunSummary
} from "./semantic-core-local-study.js";
import type { SemanticCoreLocalObserved } from "./semantic-core-local-observation.js";
import type { SemanticCoreCase } from "./semantic-core-types.js";

const git = (root: string, ...args: string[]) =>
  execFileSync("git", ["-c", "core.fsmonitor=false", ...args], {
    cwd: root,
    encoding: "utf8"
  }).trim();
export function semanticCoreLocalSource(root: string) {
  return {
    source: {
      gitCommit: git(root, "rev-parse", "HEAD"),
      gitTree: git(root, "rev-parse", "HEAD^{tree}")
    },
    status: git(root, "status", "--porcelain")
  };
}
const within = (root: string, path: string) => {
  const rel = relative(root, path);
  return (
    rel === "" ||
    (!isAbsolute(rel) && rel !== ".." && !rel.startsWith("..\\") && !rel.startsWith("../"))
  );
};
/** Resolve existing ancestors, including junctions, so an external-looking path cannot alias source. */
export async function assertSemanticCoreExternalCollection(
  repositoryRoot: string,
  collection: string
) {
  if (!isAbsolute(collection)) throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
  const roots = [
    await realpath(repositoryRoot),
    await realpath(
      dirname(resolve(repositoryRoot, git(repositoryRoot, "rev-parse", "--git-common-dir")))
    )
  ];
  const target = resolve(collection);
  let parent = target;
  const suffix: string[] = [];
  while (true) {
    try {
      parent = await realpath(parent);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT")
        throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
      const next = dirname(parent);
      if (next === parent) throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
      suffix.unshift(relative(next, parent));
      parent = next;
    }
  }
  const canonical = resolve(parent, ...suffix);
  if (
    roots.some((root) => within(root, target) || within(root, canonical) || within(canonical, root))
  )
    throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
  return canonical;
}
async function durable(path: string, data: string, flags = "wx") {
  const handle = await open(path, flags);
  try {
    await handle.writeFile(data, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
}
const json = async (path: string) => {
  const bytes = await readFile(path, "utf8");
  if (Buffer.byteLength(bytes) > 8388608) return integrityFailure();
  return JSON.parse(bytes);
};
const capacityValid = (v: { used: number; limit: number; remaining: number; observedAt: string }) =>
  Object.keys(v).sort().join(",") === "limit,observedAt,remaining,used" &&
  [v.used, v.limit, v.remaining].every((n) => Number.isSafeInteger(n) && n >= 0) &&
  v.used + v.remaining === v.limit &&
  Number.isFinite(Date.parse(v.observedAt));
const iso = (value: number) => new Date(value).toISOString();
export interface SemanticCoreLocalClock {
  now(): number;
  monotonic(): number;
  sleep(ms: number): Promise<void>;
}
const realClock: SemanticCoreLocalClock = {
  now: () => Date.now(),
  monotonic: () => performance.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms))
};
type Capacity = Awaited<ReturnType<SemanticCoreLocalTransport["capacity"]>>;
type Start = {
  attemptId: string;
  run: number;
  caseId: string;
  wireRequestDigest: string;
  requestIntentAt: string | null;
};
type JournalEntry = {
  attempt: SemanticCoreLocalAttempt;
  previousDigest: string;
  journalDigest: string;
};
export interface SemanticCoreLocalCheckpoint {
  schemaVersion: "0.1.3";
  conditionDigest: string;
  source: SemanticCoreLocalCondition["source"];
  run: number;
  scheduledAttempts: 24;
  terminalAttempts: 24;
  completionState: "COMPLETE";
  attemptReferences: { attemptId: string; journalDigest: string }[];
  runSummary: SemanticCoreLocalRunSummary;
  providerPreflight: Awaited<ReturnType<SemanticCoreLocalTransport["preflight"]>>;
  providerPreflightDigest: string;
  quotaBefore: Capacity;
  quotaAfter: Capacity | null;
  previousCheckpointDigest: string | null;
  journalDigest: string;
  startsDigest: string;
  collectionAuditDigest: string;
  captureDigest: string;
  checkpointDigest: string;
}
const journalSeed = (digest: string, run: number) =>
  semanticCoreDigest({ conditionDigest: digest, run });
async function readLines(path: string) {
  const bytes = await readFile(path, "utf8");
  if (!bytes.endsWith("\n") || Buffer.byteLength(bytes) > 8388608) return integrityFailure();
  return bytes
    .slice(0, -1)
    .split("\n")
    .map((line) => JSON.parse(line));
}
export async function validateSemanticCoreLocalCheckpoint(
  directory: string,
  condition: SemanticCoreLocalCondition,
  digest: string,
  items: SemanticCoreCase[],
  run: number,
  previousCheckpointDigest: string | null
) {
  try {
    const cp: SemanticCoreLocalCheckpoint = await json(join(directory, `run-${run}.json`));
    if (
      Object.keys(cp).sort().join(",") !==
      [
        "schemaVersion",
        "conditionDigest",
        "source",
        "run",
        "scheduledAttempts",
        "terminalAttempts",
        "completionState",
        "attemptReferences",
        "runSummary",
        "providerPreflight",
        "providerPreflightDigest",
        "quotaBefore",
        "quotaAfter",
        "previousCheckpointDigest",
        "journalDigest",
        "startsDigest",
        "collectionAuditDigest",
        "captureDigest",
        "checkpointDigest"
      ]
        .sort()
        .join(",")
    )
      integrityFailure();
    const { checkpointDigest, ...body } = cp;
    const lines: JournalEntry[] = await readLines(join(directory, `run-${run}.attempts.jsonl`));
    const starts: Start[] = await readLines(join(directory, `run-${run}.starts.jsonl`));
    if (
      semanticCoreDigest(body) !== checkpointDigest ||
      cp.schemaVersion !== "0.1.3" ||
      cp.run !== run ||
      cp.conditionDigest !== digest ||
      semanticCoreDigest(cp.source) !== semanticCoreDigest(condition.source) ||
      cp.scheduledAttempts !== 24 ||
      cp.terminalAttempts !== 24 ||
      cp.completionState !== "COMPLETE" ||
      lines.length !== 24 ||
      starts.length !== 24 ||
      cp.previousCheckpointDigest !== previousCheckpointDigest ||
      !capacityValid(cp.quotaBefore) ||
      cp.quotaBefore.remaining < 24 ||
      (cp.quotaAfter && !capacityValid(cp.quotaAfter)) ||
      cp.providerPreflightDigest !== semanticCoreDigest(cp.providerPreflight) ||
      cp.providerPreflightDigest !== semanticCoreDigest(condition.endpointProvenance.metadata)
    )
      integrityFailure();
    if (
      cp.collectionAuditDigest !==
      semanticCoreDigest(await json(join(directory, "collection.json")))
    )
      integrityFailure();
    let prior = journalSeed(digest, run);
    for (const [index, entry] of lines.entries()) {
      if (Object.keys(entry).sort().join(",") !== "attempt,journalDigest,previousDigest")
        integrityFailure();
      const item = items[index];
      if (!item) return integrityFailure();
      if (
        entry.previousDigest !== prior ||
        entry.journalDigest !==
          semanticCoreDigest({ attempt: entry.attempt, previousDigest: prior })
      )
        integrityFailure();
      validateSemanticCoreLocalAttempt(condition, digest, item, run, entry.attempt);
      const expectedStart = {
        attemptId: entry.attempt.attemptId,
        run,
        caseId: item.caseId,
        wireRequestDigest: entry.attempt.wireRequestDigest,
        requestIntentAt: entry.attempt.requestIntentAt
      };
      if (semanticCoreDigest(starts[index]) !== semanticCoreDigest(expectedStart))
        integrityFailure();
      prior = entry.journalDigest;
    }
    const attempts = lines.map((entry) => entry.attempt);
    const summary = summarizeSemanticCoreLocalRun(
      condition,
      digest,
      run,
      attempts,
      cp.runSummary.metricExecutions[0]!.executedAt
    );
    if (
      cp.journalDigest !== prior ||
      cp.startsDigest !== semanticCoreDigest(starts) ||
      semanticCoreDigest(cp.attemptReferences) !==
        semanticCoreDigest(
          lines.map((entry) => ({
            attemptId: entry.attempt.attemptId,
            journalDigest: entry.journalDigest
          }))
        ) ||
      semanticCoreDigest(summary) !== semanticCoreDigest(cp.runSummary) ||
      cp.captureDigest !== semanticCoreDigest({ conditionDigest: digest, run, attempts, summary })
    )
      integrityFailure();
    return { checkpoint: cp, attempts };
  } catch {
    return integrityFailure();
  }
}

export async function executeSemanticCoreLocalRun(options: {
  repositoryRoot: string;
  packRoot: string;
  conditionFile: string;
  validationFile: string;
  collection: string;
  run: number;
  authorizeLive: boolean;
  transport?: SemanticCoreLocalTransport;
  evidenceOrigin?: "LIVE_PROVIDER" | "SYNTHETIC_TEST";
  // Test dependencies are forbidden for a LIVE_PROVIDER record.
  clock?: SemanticCoreLocalClock;
  sourceSnapshot?: () => ReturnType<typeof semanticCoreLocalSource>;
  onAttempt?: (attempt: SemanticCoreLocalAttempt) => Promise<void>;
}) {
  if (!options.authorizeLive || ![1, 2, 3].includes(options.run))
    throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
  const origin = options.evidenceOrigin ?? "LIVE_PROVIDER";
  if (origin === "LIVE_PROVIDER" && (options.clock || options.sourceSnapshot))
    throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
  const clock = options.clock ?? realClock;
  const sourceSnapshot =
    options.sourceSnapshot ?? (() => semanticCoreLocalSource(options.repositoryRoot));
  const assertSource = () => {
    const current = sourceSnapshot();
    if (current.status) identityFailure();
    return current.source;
  };
  const source = assertSource();
  const frozenBytes = await readFile(options.conditionFile, "utf8");
  const frozen: SemanticCoreLocalFrozenFile = JSON.parse(frozenBytes);
  const prepared = await validateSemanticCoreLocalCondition(
    options.repositoryRoot,
    options.packRoot,
    frozen,
    source
  );
  const condition = prepared.condition;
  const digest = frozen.conditionDigest;
  const repositoryValidation = validateSemanticCoreLocalClearance(
    await json(options.validationFile),
    source
  );
  const directory = await assertSemanticCoreExternalCollection(
    options.repositoryRoot,
    options.collection
  );
  const attempts: SemanticCoreLocalAttempt[] = [];
  const summaries: SemanticCoreLocalRunSummary[] = [];
  const checkpoints: SemanticCoreLocalCheckpoint[] = [];
  let audit: {
    conditionDigest: string;
    source: typeof source;
    evidenceOrigin: typeof origin;
    openedAt: string;
    deadline: string;
  };
  if (options.run === 1) {
    try {
      await lstat(directory);
      return integrityFailure();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const openedAt = iso(clock.now());
    audit = {
      conditionDigest: digest,
      source,
      evidenceOrigin: origin,
      openedAt,
      deadline: iso(Date.parse(openedAt) + 168 * 3600000)
    };
  } else {
    const expected = [
      "condition.json",
      "collection.json",
      ...[1, 2, 3]
        .filter((run) => run < options.run)
        .flatMap((run) => [
          `run-${run}.json`,
          `run-${run}.attempts.jsonl`,
          `run-${run}.starts.jsonl`
        ])
    ].sort();
    if (semanticCoreDigest((await readdir(directory)).sort()) !== semanticCoreDigest(expected))
      integrityFailure();
    if (
      semanticCoreDigest(await json(join(directory, "condition.json"))) !==
      semanticCoreDigest(frozen)
    )
      identityFailure();
    audit = await json(join(directory, "collection.json"));
    if (
      audit.conditionDigest !== digest ||
      semanticCoreDigest(audit.source) !== semanticCoreDigest(source) ||
      audit.evidenceOrigin !== origin ||
      !Number.isFinite(Date.parse(audit.openedAt)) ||
      Date.parse(audit.deadline) - Date.parse(audit.openedAt) !== 168 * 3600000 ||
      clock.now() > Date.parse(audit.deadline) ||
      clock.now() < Date.parse(audit.openedAt)
    )
      integrityFailure();
    for (let run = 1; run < options.run; run++) {
      const prior = await validateSemanticCoreLocalCheckpoint(
        directory,
        condition,
        digest,
        prepared.items,
        run,
        checkpoints.at(-1)?.checkpointDigest ?? null
      );
      attempts.push(...prior.attempts);
      summaries.push(prior.checkpoint.runSummary);
      checkpoints.push(prior.checkpoint);
    }
    if (
      attempts.some((a) =>
        [
          "IDENTITY_SUBSTITUTION",
          "ZERO_COST_POLICY_FAILURE",
          "CREDENTIAL_UNAVAILABLE",
          "PROVIDER_METADATA_MISMATCH"
        ].includes(a.observation.error ?? "")
      )
    )
      throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
  }
  const transport = options.transport ?? new SemanticCoreLocalTransport();
  // Metadata GETs only. Generation remains impossible until all independent gates pass.
  const metadata = await transport.preflight();
  if (semanticCoreDigest(metadata) !== semanticCoreDigest(condition.endpointProvenance.metadata))
    throw new SemanticCoreQualificationError("PROVIDER_METADATA_MISMATCH");
  const quotaBefore = await transport.capacity();
  if (!capacityValid(quotaBefore)) throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
  if (quotaBefore.remaining < 24)
    throw new SemanticCoreQualificationError("INSUFFICIENT_FREE_REQUEST_CAPACITY");
  if (
    semanticCoreDigest(assertSource()) !== semanticCoreDigest(source) ||
    clock.now() > Date.parse(audit.deadline)
  )
    identityFailure();
  if (options.run === 1) await mkdir(directory, { recursive: false });
  const lock = join(directory, "active.lock");
  await durable(
    lock,
    JSON.stringify({ protocol: "0.1.3", run: options.run, conditionDigest: digest }) + "\n"
  );
  let begun = false;
  let completed = false;
  try {
    if (options.run === 1) {
      await durable(join(directory, "condition.json"), frozenBytes);
      await durable(join(directory, "collection.json"), JSON.stringify(audit, null, 2) + "\n");
    }
    const journal = join(directory, `run-${options.run}.attempts.jsonl`);
    const startJournal = join(directory, `run-${options.run}.starts.jsonl`);
    await durable(journal, "");
    await durable(startJournal, "");
    begun = true;
    const priorStart = attempts
      .filter((attempt) => attempt.requestStartedAt !== null)
      .at(-1)?.requestStartedAt;
    if (priorStart && clock.now() < Date.parse(priorStart)) integrityFailure();
    let lastStart: number | null = priorStart
      ? clock.monotonic() - (clock.now() - Date.parse(priorStart))
      : null;
    let prior = journalSeed(digest, options.run);
    const starts: Start[] = [];
    const entries: JournalEntry[] = [];
    let halted:
      "IDENTITY_SUBSTITUTION" | "ZERO_COST_POLICY_FAILURE" | "CREDENTIAL_UNAVAILABLE" | null = null;
    for (const [index, item] of prepared.items.entries()) {
      let requestStartedAt: string | null = null;
      let requestIntentAt: string | null = null;
      if (!halted) {
        if (lastStart !== null) {
          let delay = 3500 - (clock.monotonic() - lastStart);
          while (delay > 0) {
            await clock.sleep(delay);
            delay = 3500 - (clock.monotonic() - lastStart);
          }
        }
        try {
          if (
            semanticCoreDigest(assertSource()) !== semanticCoreDigest(source) ||
            clock.now() > Date.parse(audit.deadline)
          )
            halted = "IDENTITY_SUBSTITUTION";
        } catch {
          halted = "IDENTITY_SUBSTITUTION";
        }
        if (!halted) {
          requestIntentAt = iso(clock.now());
        }
      }
      const start = {
        attemptId: `semantic-core-0.1.3-run-${options.run}-${item.caseId}`,
        run: options.run,
        caseId: item.caseId,
        wireRequestDigest: condition.cases[index]!.wireRequestDigest,
        requestIntentAt
      };
      // A durable intent survives a crash between POST submission and terminal receipt.
      await durable(startJournal, JSON.stringify(start) + "\n", "a");
      starts.push(start);
      const observed: SemanticCoreLocalObserved = halted
        ? {
            observation: { status: "ERROR", error: halted, rawResponseAvailability: "UNAVAILABLE" },
            transport: {
              stages: [],
              httpStatus: null,
              returnedModel: null,
              returnedProvider: null,
              usage: null,
              embeddedProviderError: false,
              error: halted,
              contentEvidence: null
            }
          }
        : await observeSemanticCoreLocal(transport, semanticCoreSubjectInput(item), () => {
            lastStart = clock.monotonic();
            requestStartedAt = iso(clock.now());
          });
      if (
        ["IDENTITY_SUBSTITUTION", "ZERO_COST_POLICY_FAILURE", "CREDENTIAL_UNAVAILABLE"].includes(
          observed.observation.error ?? ""
        )
      )
        halted = observed.observation.error as typeof halted;
      const attempt = makeSemanticCoreLocalAttempt(
        condition,
        digest,
        item,
        options.run,
        observed,
        requestStartedAt,
        iso(clock.now()),
        requestIntentAt
      );
      const entry = {
        attempt,
        previousDigest: prior,
        journalDigest: semanticCoreDigest({ attempt, previousDigest: prior })
      };
      await durable(journal, JSON.stringify(entry) + "\n", "a");
      entries.push(entry);
      prior = entry.journalDigest;
      attempts.push(attempt);
      await options.onAttempt?.(attempt);
    }
    const quotaAfter = await transport.capacity().catch(() => null);
    const selected = attempts.slice(-24);
    const summary = summarizeSemanticCoreLocalRun(
      condition,
      digest,
      options.run,
      selected,
      iso(clock.now())
    );
    summaries.push(summary);
    const body = {
      schemaVersion: "0.1.3" as const,
      conditionDigest: digest,
      source,
      run: options.run,
      scheduledAttempts: 24 as const,
      terminalAttempts: 24 as const,
      completionState: "COMPLETE" as const,
      attemptReferences: entries.map((entry) => ({
        attemptId: entry.attempt.attemptId,
        journalDigest: entry.journalDigest
      })),
      runSummary: summary,
      providerPreflight: metadata,
      providerPreflightDigest: semanticCoreDigest(metadata),
      quotaBefore,
      quotaAfter,
      previousCheckpointDigest: checkpoints.at(-1)?.checkpointDigest ?? null,
      journalDigest: prior,
      startsDigest: semanticCoreDigest(starts),
      collectionAuditDigest: semanticCoreDigest(audit),
      captureDigest: semanticCoreDigest({
        conditionDigest: digest,
        run: options.run,
        attempts: selected,
        summary
      })
    };
    const checkpoint: SemanticCoreLocalCheckpoint = {
      ...body,
      checkpointDigest: semanticCoreDigest(body)
    };
    await durable(
      join(directory, `run-${options.run}.json`),
      JSON.stringify(checkpoint, null, 2) + "\n"
    );
    await validateSemanticCoreLocalCheckpoint(
      directory,
      condition,
      digest,
      prepared.items,
      options.run,
      body.previousCheckpointDigest
    );
    checkpoints.push(checkpoint);
    if (options.run < 3) {
      completed = true;
      return {
        collectionState: "COMPLETE_RUN_PENDING_STUDY",
        qualificationOutcome: "INSUFFICIENT_EVIDENCE",
        accountedAttempts: attempts.length,
        nextRun: options.run + 1
      };
    }
    for (const [index, priorCheckpoint] of checkpoints.entries()) {
      const verified = await validateSemanticCoreLocalCheckpoint(
        directory,
        condition,
        digest,
        prepared.items,
        index + 1,
        checkpoints[index - 1]?.checkpointDigest ?? null
      );
      if (
        semanticCoreDigest(verified.checkpoint) !== semanticCoreDigest(priorCheckpoint) ||
        semanticCoreDigest(verified.attempts) !==
          semanticCoreDigest(attempts.slice(index * 24, (index + 1) * 24))
      )
        integrityFailure();
    }
    const final = finalizeSemanticCoreLocalStudy({
      condition,
      conditionDigest: digest,
      items: prepared.items,
      attempts,
      runs: summaries,
      checkpoints,
      evidenceOrigin: origin,
      repositoryValidation,
      infrastructureFindings: checkpoints.some((cp) => cp.quotaAfter === null)
        ? ["POST_RUN_QUOTA_UNAVAILABLE"]
        : []
    });
    await durable(
      join(directory, "qualification.json"),
      JSON.stringify(
        {
          ...final,
          captureDigest: semanticCoreDigest(final.capture),
          checkpoints
        },
        null,
        2
      ) + "\n"
    );
    completed = true;
    return {
      collectionState: "COMPLETE_STUDY",
      qualificationOutcome: final.qualification.outcome,
      accountedAttempts: 72,
      nextRun: null
    };
  } finally {
    if (!begun || completed) await unlink(lock);
  }
}
