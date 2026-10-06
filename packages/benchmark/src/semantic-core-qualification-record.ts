import { readFileSync } from "node:fs";
import { Ajv2020 } from "ajv/dist/2020.js";
import { canonicalJson } from "../../sandbox-contracts/src/index.js";
import { SEMANTIC_CORE_QUALIFICATION_PROTOCOL } from "./semantic-core-qualification-types.js";

const check = new Ajv2020({ strict: true, allErrors: true }).compile(
  JSON.parse(
    readFileSync(
      new URL("../../../schemas/semantic-core-qualification-record.schema.json", import.meta.url),
      "utf8"
    )
  )
);
function plain(value: unknown, seen = new Set<object>()): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (
    typeof value !== "object" ||
    seen.has(value) ||
    (!Array.isArray(value) &&
      Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  )
    return false;
  seen.add(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(descriptors).filter(
    (key) => !(Array.isArray(value) && key === "length")
  );
  const valid = keys.every((key) => {
    const descriptor = typeof key === "string" ? descriptors[key] : undefined;
    return (
      descriptor?.enumerable === true && "value" in descriptor && plain(descriptor.value, seen)
    );
  });
  seen.delete(value);
  return valid;
}
/** Structural integrity only; this predicate cannot approve BM3 or establish empirical truth. */
export function validateSemanticCoreQualificationRecord(value: unknown): boolean {
  if (!plain(value) || !check(value)) return false;
  const record = value as {
    protocol: unknown;
    outcome: string;
    source: { gitCommit: string };
    repositoryValidation: { sourceCommit: string } | null;
    reliabilityReferences: string[];
    packages: unknown[];
  };
  return (
    canonicalJson(record.protocol) === canonicalJson(SEMANTIC_CORE_QUALIFICATION_PROTOCOL) &&
    (record.outcome !== "QUALIFIED_FOR_BM3_REVIEW" ||
      (record.source.gitCommit === record.repositoryValidation?.sourceCommit &&
        record.reliabilityReferences.length === 53 &&
        record.packages.length === 4))
  );
}
