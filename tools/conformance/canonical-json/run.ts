import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  hashCanonical,
  LEGACY_TYPESCRIPT_CANONICALIZATION_PROFILE,
  SHARED_CANONICALIZATION_PROFILE
} from "../../../packages/sandbox-contracts/src/canonicalization-profiles.js";

interface SupportedVector {
  readonly id: string;
  readonly category: string;
  readonly input: unknown;
  readonly expectedCanonicalUtf8: string;
  readonly expectedCanonicalUtf8Hex: string;
  readonly expectedSha256: string;
  readonly expectedStatus: "SUPPORTED";
}

interface OutOfDomainVector {
  readonly id: string;
  readonly category: string;
  readonly taggedInput: { readonly type: string; readonly value?: string };
  readonly expectedStatus: "OUT_OF_DOMAIN";
  readonly reason: string;
}

const here = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(here, "../../..");
const vectorsPath = resolve(repositoryRoot, "tests/fixtures/canonical-json/v1/vectors.json");
const legacyTsPath = resolve(
  repositoryRoot,
  "tests/fixtures/canonical-json/legacy/typescript-v0.json"
);
const legacyPythonPath = resolve(
  repositoryRoot,
  "tests/fixtures/canonical-json/legacy/python-v0.json"
);
const expectedResultsPath = resolve(here, "results.json");

const vectors = JSON.parse(readFileSync(vectorsPath, "utf8")) as {
  readonly supported: readonly SupportedVector[];
  readonly outOfDomain: readonly OutOfDomainVector[];
};
const legacyTs = JSON.parse(readFileSync(legacyTsPath, "utf8")) as {
  readonly input: unknown;
  readonly expectedCanonicalUtf8: string;
  readonly expectedSha256: string;
};

function taggedInput(vector: OutOfDomainVector): unknown {
  switch (vector.taggedInput.type) {
    case "negative-zero":
      return -0;
    case "float":
      return Number(vector.taggedInput.value);
    case "nan":
      return Number.NaN;
    case "positive-infinity":
      return Number.POSITIVE_INFINITY;
    case "negative-infinity":
      return Number.NEGATIVE_INFINITY;
    case "unsafe-positive-integer":
      return 9_007_199_254_740_992;
    case "unsafe-negative-integer":
      return -9_007_199_254_740_992;
    default:
      throw new Error(`Unknown tagged input: ${vector.taggedInput.type}`);
  }
}

const tsResults = vectors.supported.map((vector) => {
  const result = hashCanonical(vector.input, { profile: SHARED_CANONICALIZATION_PROFILE });
  const independentNodeDigest = createHash("sha256")
    .update(Buffer.from(vector.expectedCanonicalUtf8Hex, "hex"))
    .digest("hex");
  if (
    result.canonicalUtf8 !== vector.expectedCanonicalUtf8 ||
    result.canonicalUtf8Hex !== vector.expectedCanonicalUtf8Hex ||
    result.sha256 !== vector.expectedSha256 ||
    independentNodeDigest !== vector.expectedSha256
  ) {
    throw new Error(`TypeScript vector mismatch: ${vector.id}`);
  }
  return {
    id: vector.id,
    status: "SUPPORTED",
    byteMatch: true,
    digestMatch: true,
    crossLanguageMatch: true,
    divergence: "NO_DIVERGENCE"
  };
});

for (const vector of vectors.outOfDomain) {
  let rejected = false;
  try {
    hashCanonical(taggedInput(vector), { profile: SHARED_CANONICALIZATION_PROFILE });
  } catch (error) {
    if (error instanceof TypeError) rejected = true;
  }
  if (!rejected) throw new Error(`TypeScript did not reject out-of-domain vector: ${vector.id}`);
  tsResults.push({
    id: vector.id,
    status: "OUT_OF_DOMAIN",
    byteMatch: true,
    digestMatch: true,
    crossLanguageMatch: true,
    divergence: "NO_DIVERGENCE"
  });
}

const legacyTsResult = hashCanonical(legacyTs.input, {
  profile: LEGACY_TYPESCRIPT_CANONICALIZATION_PROFILE
});
if (
  legacyTsResult.canonicalUtf8 !== legacyTs.expectedCanonicalUtf8 ||
  legacyTsResult.sha256 !== legacyTs.expectedSha256
) {
  throw new Error("Legacy TypeScript profile changed");
}

function runPython(): string {
  const candidates = [process.env.PYTHON, "python3", "python", "py"].filter(
    (candidate): candidate is string => Boolean(candidate)
  );
  for (const candidate of candidates) {
    const args = candidate === "py" ? ["-3"] : [];
    const result = spawnSync(
      candidate,
      [...args, resolve(here, "python-verifier.py"), vectorsPath, legacyPythonPath],
      { cwd: repositoryRoot, encoding: "utf8" }
    );
    if (!result.error && result.status === 0) return result.stdout;
  }
  throw new Error("Python 3.10+ is required for canonical JSON conformance");
}

const python = JSON.parse(runPython()) as {
  readonly results: readonly {
    readonly id: string;
    readonly status: string;
    readonly canonicalUtf8?: string;
    readonly canonicalUtf8Hex?: string;
    readonly sha256?: string;
  }[];
  readonly legacy: { readonly canonicalUtf8: string; readonly sha256: string };
};

for (const vector of vectors.supported) {
  const result = python.results.find((candidate) => candidate.id === vector.id);
  if (
    result?.status !== "SUPPORTED" ||
    result.canonicalUtf8 !== vector.expectedCanonicalUtf8 ||
    result.canonicalUtf8Hex !== vector.expectedCanonicalUtf8Hex ||
    result.sha256 !== vector.expectedSha256
  ) {
    throw new Error(`Python vector mismatch: ${vector.id}`);
  }
}
for (const vector of vectors.outOfDomain) {
  const result = python.results.find((candidate) => candidate.id === vector.id);
  if (result?.status !== "OUT_OF_DOMAIN") {
    throw new Error(`Python did not reject out-of-domain vector: ${vector.id}`);
  }
}

const legacyPython = JSON.parse(readFileSync(legacyPythonPath, "utf8")) as {
  readonly expectedCanonicalUtf8: string;
  readonly expectedSha256: string;
};
if (
  python.legacy.canonicalUtf8 !== legacyPython.expectedCanonicalUtf8 ||
  python.legacy.sha256 !== legacyPython.expectedSha256
) {
  throw new Error("Legacy Python profile changed");
}

const normalized = {
  evidenceVersion: "0.1",
  profile: SHARED_CANONICALIZATION_PROFILE,
  hashAlgorithm: "sha256",
  inputDomain: {
    values: ["null", "boolean", "string", "safe-integer", "array", "object"],
    floats: "OUT_OF_DOMAIN",
    unicodeNormalization: "NONE",
    keyOrdering: "UNICODE_SCALAR_VALUE"
  },
  implementations: [
    { id: "typescript-production-v1", role: "production", language: "TypeScript" },
    { id: "python-reference-v1", role: "independent-reference", language: "Python" },
    { id: "node-crypto-sha256", role: "independent-digest-check", language: "Node.js" }
  ],
  summary: {
    vectors: vectors.supported.length + vectors.outOfDomain.length,
    supportedVectors: vectors.supported.length,
    outOfDomainVectors: vectors.outOfDomain.length,
    canonicalByteMatches: vectors.supported.length * 2,
    digestMatches: vectors.supported.length * 3,
    crossLanguageDivergences: 0
  },
  legacy: {
    typescriptV0Preserved: true,
    pythonV0Preserved: true
  },
  results: tsResults
};

const expectedResults = JSON.parse(readFileSync(expectedResultsPath, "utf8"));
if (JSON.stringify(expectedResults) !== JSON.stringify(normalized)) {
  throw new Error("Deterministic results differ from checked-in results.json");
}

process.stdout.write(
  `Canonical JSON conformance passed: ${normalized.summary.vectors} vectors, ` +
    `${normalized.summary.canonicalByteMatches} byte checks, ` +
    `${normalized.summary.digestMatches} digest checks, 0 divergences.\n`
);
