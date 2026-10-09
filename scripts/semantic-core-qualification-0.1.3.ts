import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { parseSemanticCoreLocalArguments } from "../packages/benchmark/src/semantic-core-local-cli.js";
import {
  executeSemanticCoreLocalRun,
  semanticCoreLocalSource,
  assertSemanticCoreExternalCollection
} from "../packages/benchmark/src/semantic-core-local-runner.js";
import {
  validateSemanticCoreLocalCondition,
  validateSemanticCoreLocalClearance,
  identityFailure
} from "../packages/benchmark/src/semantic-core-local-condition.js";
import { SemanticCoreQualificationError } from "../packages/benchmark/src/semantic-core-qualification-types.js";

try {
  const args = parseSemanticCoreLocalArguments(process.argv.slice(2));
  const repositoryRoot = resolve(import.meta.dirname, "..");
  const packRoot = join(repositoryRoot, "fixtures/benchmark-packs/semantic-core-pilot-0.1.0");
  if (args.mode === "verify") {
    const current = semanticCoreLocalSource(repositoryRoot);
    if (current.status) identityFailure();
    const frozen = JSON.parse(await readFile(args.conditionFile, "utf8"));
    await validateSemanticCoreLocalCondition(repositoryRoot, packRoot, frozen, current.source);
    validateSemanticCoreLocalClearance(
      JSON.parse(await readFile(args.validationFile, "utf8")),
      current.source
    );
    await assertSemanticCoreExternalCollection(repositoryRoot, args.collection);
    console.log(
      JSON.stringify({
        status: "PROSPECTIVE_SOURCE_VERIFIED",
        source: current.source,
        conditionDigest: frozen.conditionDigest,
        generationRequests: 0,
        liveRouteAndQuota: "REQUIRED_BEFORE_RUN"
      })
    );
  } else {
    const result = await executeSemanticCoreLocalRun({
      ...args,
      repositoryRoot,
      packRoot,
      onAttempt: async (attempt) => {
        console.log(
          JSON.stringify({
            attemptId: attempt.attemptId,
            state: attempt.evaluation.state,
            httpStatus: attempt.transport.httpStatus,
            replayExact: attempt.replayExact
          })
        );
      }
    });
    console.log(JSON.stringify(result));
  }
} catch (error) {
  // Fixed codes only; never expose exception text, keys, payloads or private paths.
  console.error(
    JSON.stringify({
      status: "BLOCKED",
      error: error instanceof SemanticCoreQualificationError ? error.code : "PREFLIGHT_FAILURE"
    })
  );
  process.exitCode = 1;
}
