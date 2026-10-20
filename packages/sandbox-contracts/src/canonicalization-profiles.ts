import { canonicalJson, computeSha256 } from "./crypto-utils.js";

export const LEGACY_TYPESCRIPT_CANONICALIZATION_PROFILE = "legacy-ts-v0" as const;
export const SHARED_CANONICALIZATION_PROFILE = "semantiq-canonical-json-v1" as const;

export type SupportedCanonicalizationProfile =
  | typeof LEGACY_TYPESCRIPT_CANONICALIZATION_PROFILE
  | typeof SHARED_CANONICALIZATION_PROFILE;

export interface CanonicalHashResult {
  readonly canonicalization: {
    readonly profile: SupportedCanonicalizationProfile;
    readonly hashAlgorithm: "sha256";
  };
  readonly canonicalUtf8: string;
  readonly canonicalUtf8Hex: string;
  readonly sha256: string;
}

const MAX_SAFE_INTEGER = 9_007_199_254_740_991;

function assertValidUnicode(value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new TypeError("semantiq-canonical-json-v1 rejects unpaired UTF-16 surrogates");
      }
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      throw new TypeError("semantiq-canonical-json-v1 rejects unpaired UTF-16 surrogates");
    }
  }
}

function compareUnicodeScalarValues(left: string, right: string): number {
  const leftPoints = Array.from(left, (value) => value.codePointAt(0)!);
  const rightPoints = Array.from(right, (value) => value.codePointAt(0)!);
  const sharedLength = Math.min(leftPoints.length, rightPoints.length);
  for (let index = 0; index < sharedLength; index += 1) {
    if (leftPoints[index] !== rightPoints[index]) {
      return leftPoints[index]! - rightPoints[index]!;
    }
  }
  return leftPoints.length - rightPoints.length;
}

function canonicalizeV1Value(value: unknown, ancestors: WeakSet<object>): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") {
    assertValidUnicode(value);
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || Object.is(value, -0)) {
      throw new TypeError(
        `semantiq-canonical-json-v1 accepts only integers from -${MAX_SAFE_INTEGER} to ${MAX_SAFE_INTEGER}, excluding negative zero`
      );
    }
    return String(value);
  }
  if (typeof value !== "object") {
    throw new TypeError(`semantiq-canonical-json-v1 rejects ${typeof value} values`);
  }
  if (ancestors.has(value)) {
    throw new TypeError("semantiq-canonical-json-v1 rejects cyclic values");
  }

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return `[${value.map((item) => canonicalizeV1Value(item, ancestors)).join(",")}]`;
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError("semantiq-canonical-json-v1 accepts only plain JSON objects");
    }

    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Reflect.ownKeys(descriptors);
    if (keys.some((key) => typeof key !== "string")) {
      throw new TypeError("semantiq-canonical-json-v1 rejects symbol-keyed properties");
    }
    for (const key of keys as string[]) {
      const descriptor = descriptors[key]!;
      if (!descriptor.enumerable || !("value" in descriptor)) {
        throw new TypeError("semantiq-canonical-json-v1 accepts only enumerable data properties");
      }
      assertValidUnicode(key);
    }

    return `{${(keys as string[])
      .sort(compareUnicodeScalarValues)
      .map(
        (key) => `${JSON.stringify(key)}:${canonicalizeV1Value(descriptors[key]!.value, ancestors)}`
      )
      .join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}

export function canonicalizeV1(value: unknown): string {
  return canonicalizeV1Value(value, new WeakSet<object>());
}

export function hashCanonical(
  value: unknown,
  options: { readonly profile: SupportedCanonicalizationProfile }
): CanonicalHashResult {
  let canonicalUtf8: string;
  if (options.profile === SHARED_CANONICALIZATION_PROFILE) {
    canonicalUtf8 = canonicalizeV1(value);
  } else if (options.profile === LEGACY_TYPESCRIPT_CANONICALIZATION_PROFILE) {
    canonicalUtf8 = canonicalJson(value);
  } else {
    throw new TypeError(`Unknown canonicalization profile: ${String(options.profile)}`);
  }

  return {
    canonicalization: { profile: options.profile, hashAlgorithm: "sha256" },
    canonicalUtf8,
    canonicalUtf8Hex: Buffer.from(canonicalUtf8, "utf8").toString("hex"),
    sha256: computeSha256(canonicalUtf8)
  };
}
