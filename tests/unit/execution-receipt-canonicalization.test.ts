import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BenchmarkExecutionReceiptIssuer,
  canonicalJson,
  canonicalizeV1,
  computeSha256,
  RECEIPT_VERIFICATION_FAILURE,
  SHARED_CANONICALIZATION_PROFILE,
  verifiableBenchmarkExecutionReceiptSchema,
  type VerifiableBenchmarkExecutionReceipt
} from "../../packages/sandbox-contracts/src/index.js";

interface ReceiptFixture {
  reason: string;
  expectedCanonicalUtf8: string;
  expectedDigest: string;
  expectedVerification: boolean;
  receipt: VerifiableBenchmarkExecutionReceipt;
}

const fixtureRoot = resolve(import.meta.dirname, "../fixtures/execution-receipts");
const readFixture = (relativePath: string): ReceiptFixture =>
  JSON.parse(readFileSync(resolve(fixtureRoot, relativePath), "utf8")) as ReceiptFixture;

const legacyFixture = readFixture("legacy/receipt-v1.0.0.json");
const v1Fixture = readFixture("v1/receipt-v1.0.0-canonical-v1.json");
const issuer = new BenchmarkExecutionReceiptIssuer();
type ReceiptIssuanceParams = Parameters<BenchmarkExecutionReceiptIssuer["issueReceipt"]>[0];

function unsignedBody(receipt: VerifiableBenchmarkExecutionReceipt): Record<string, unknown> {
  const unsigned = { ...receipt } as Record<string, unknown>;
  delete unsigned.receiptDigestSha256;
  delete unsigned.signatureHex;
  return unsigned;
}

function issuanceParams(receipt: VerifiableBenchmarkExecutionReceipt): ReceiptIssuanceParams {
  const params = { ...receipt } as Record<string, unknown>;
  delete params.canonicalization;
  delete params.issuedAt;
  delete params.receiptDigestSha256;
  delete params.signatureHex;
  return params as unknown as ReceiptIssuanceParams;
}

function asUntrusted(
  receipt: VerifiableBenchmarkExecutionReceipt,
  changes: Record<string, unknown>
): VerifiableBenchmarkExecutionReceipt {
  return { ...receipt, ...changes } as unknown as VerifiableBenchmarkExecutionReceipt;
}

afterEach(() => vi.useRealTimers());

describe("execution receipt canonicalization migration", () => {
  it("freezes exact legacy bytes and digest while preserving verification", () => {
    const body = unsignedBody(legacyFixture.receipt);
    expect(canonicalJson(body)).toBe(legacyFixture.expectedCanonicalUtf8);
    expect(computeSha256(legacyFixture.expectedCanonicalUtf8)).toBe(legacyFixture.expectedDigest);
    expect(legacyFixture.receipt.receiptDigestSha256).toBe(legacyFixture.expectedDigest);
    expect(legacyFixture.receipt.canonicalization).toBeUndefined();
    expect(issuer.verifyReceipt(legacyFixture.receipt).isValid).toBe(
      legacyFixture.expectedVerification
    );
  });

  it("verifies exact V1 canonical bytes and digest from the checked-in fixture", () => {
    const body = unsignedBody(v1Fixture.receipt);
    expect(canonicalizeV1(body)).toBe(v1Fixture.expectedCanonicalUtf8);
    expect(computeSha256(v1Fixture.expectedCanonicalUtf8)).toBe(v1Fixture.expectedDigest);
    expect(v1Fixture.receipt.receiptDigestSha256).toBe(v1Fixture.expectedDigest);
    expect(issuer.verifyReceipt(v1Fixture.receipt).isValid).toBe(v1Fixture.expectedVerification);
  });

  it("keeps canonicalization metadata schema-additive and exact", () => {
    expect(verifiableBenchmarkExecutionReceiptSchema.required).not.toContain("canonicalization");
    expect(verifiableBenchmarkExecutionReceiptSchema.properties.canonicalization).toEqual({
      type: "object",
      required: ["profile", "hashAlgorithm"],
      additionalProperties: false,
      properties: {
        profile: { type: "string", enum: [SHARED_CANONICALIZATION_PROFILE] },
        hashAlgorithm: { type: "string", enum: ["sha256"] }
      }
    });

    const validate = new Ajv2020({ strict: false }).compile(
      verifiableBenchmarkExecutionReceiptSchema
    );
    expect(validate(legacyFixture.receipt)).toBe(true);
    expect(validate(v1Fixture.receipt)).toBe(true);
    expect(
      validate({
        ...v1Fixture.receipt,
        canonicalization: { ...v1Fixture.receipt.canonicalization, fallback: true }
      })
    ).toBe(false);
  });

  it("issues an explicitly requested V1 receipt with covered metadata", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(v1Fixture.receipt.issuedAt));
    const legacyBefore = JSON.stringify(legacyFixture);
    const receipt = issuer.issueReceipt(issuanceParams(v1Fixture.receipt), {
      canonicalizationProfile: SHARED_CANONICALIZATION_PROFILE
    });

    expect(receipt).toEqual(v1Fixture.receipt);
    expect(receipt.canonicalization).toEqual({
      profile: SHARED_CANONICALIZATION_PROFILE,
      hashAlgorithm: "sha256"
    });
    expect(JSON.stringify(legacyFixture)).toBe(legacyBefore);
  });

  it("leaves the established default issuance path byte-identical to legacy behavior", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(legacyFixture.receipt.issuedAt));
    expect(issuer.issueReceipt(issuanceParams(legacyFixture.receipt))).toEqual(
      legacyFixture.receipt
    );
  });

  it("verifies legacy bytes without requiring the payload to match the V1 value domain", () => {
    const body = {
      ...unsignedBody(legacyFixture.receipt),
      financial: { ...legacyFixture.receipt.financial, totalGrossCostUsd: 0.25 }
    };
    expect(() => canonicalizeV1(body)).toThrow("excluding negative zero");
    const digest = computeSha256(canonicalJson(body));
    const receipt = {
      ...body,
      receiptDigestSha256: digest,
      signatureHex: `3045022100${digest.substring(0, 32)}0220${digest.substring(32, 64)}`
    } as unknown as VerifiableBenchmarkExecutionReceipt;
    expect(issuer.verifyReceipt(receipt).isValid).toBe(true);
  });

  it("is deterministic across repeated issuance and object insertion order", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(v1Fixture.receipt.issuedAt));
    const params = issuanceParams(v1Fixture.receipt);
    const left = issuer.issueReceipt(
      {
        ...params,
        observation: { ...params.observation, metrics: { zeta: 2, alpha: 1 } }
      },
      { canonicalizationProfile: SHARED_CANONICALIZATION_PROFILE }
    );
    const right = issuer.issueReceipt(
      {
        ...params,
        observation: { ...params.observation, metrics: { alpha: 1, zeta: 2 } }
      },
      { canonicalizationProfile: SHARED_CANONICALIZATION_PROFILE }
    );

    expect(left.receiptDigestSha256).toBe(right.receiptDigestSha256);
    expect(issuer.verifyReceipt(left).isValid).toBe(true);
    expect(issuer.verifyReceipt(right).isValid).toBe(true);
    expect(issuer.verifyReceipt(JSON.parse(JSON.stringify(left))).isValid).toBe(true);
  });

  it("fails closed for payload and digest tampering in both profiles", () => {
    for (const receipt of [legacyFixture.receipt, v1Fixture.receipt]) {
      const payloadTamper = asUntrusted(receipt, {
        model: { ...receipt.model, modelId: "tampered" }
      });
      const digestTamper = asUntrusted(receipt, { receiptDigestSha256: "0".repeat(64) });
      expect(issuer.verifyReceipt(payloadTamper).errors.join(" ")).toContain(
        RECEIPT_VERIFICATION_FAILURE.RECEIPT_DIGEST_MISMATCH
      );
      expect(issuer.verifyReceipt(digestTamper).errors.join(" ")).toContain(
        RECEIPT_VERIFICATION_FAILURE.RECEIPT_DIGEST_MISMATCH
      );
    }
  });

  it.each([
    [
      "unknown profile",
      { profile: "future-profile", hashAlgorithm: "sha256" },
      RECEIPT_VERIFICATION_FAILURE.UNKNOWN_CANONICALIZATION_PROFILE
    ],
    [
      "empty profile",
      { profile: "", hashAlgorithm: "sha256" },
      RECEIPT_VERIFICATION_FAILURE.MALFORMED_CANONICALIZATION_METADATA
    ],
    [
      "unsupported algorithm",
      { profile: SHARED_CANONICALIZATION_PROFILE, hashAlgorithm: "sha512" },
      RECEIPT_VERIFICATION_FAILURE.UNSUPPORTED_HASH_ALGORITHM
    ],
    ["null metadata", null, RECEIPT_VERIFICATION_FAILURE.MALFORMED_CANONICALIZATION_METADATA],
    [
      "additional metadata",
      { profile: SHARED_CANONICALIZATION_PROFILE, hashAlgorithm: "sha256", fallback: true },
      RECEIPT_VERIFICATION_FAILURE.MALFORMED_CANONICALIZATION_METADATA
    ]
  ])("rejects %s without profile guessing", (_name, canonicalization, failure) => {
    const result = issuer.verifyReceipt(asUntrusted(v1Fixture.receipt, { canonicalization }));
    expect(result.isValid).toBe(false);
    expect(result.isDigestValid).toBe(false);
    expect(result.errors.join(" ")).toContain(failure);
  });

  it("prevents profile stripping from downgrading a V1 receipt", () => {
    const stripped = { ...v1Fixture.receipt } as Record<string, unknown>;
    delete stripped.canonicalization;
    const result = issuer.verifyReceipt(stripped as unknown as VerifiableBenchmarkExecutionReceipt);
    expect(result.isValid).toBe(false);
    expect(result.errors.join(" ")).toContain(RECEIPT_VERIFICATION_FAILURE.RECEIPT_DIGEST_MISMATCH);
  });

  it("rejects legacy/V1 confusion and unsupported legacy versions", () => {
    const substituted = asUntrusted(v1Fixture.receipt, {
      canonicalization: { profile: "legacy-ts-v0", hashAlgorithm: "sha256" }
    });
    expect(issuer.verifyReceipt(substituted).errors.join(" ")).toContain(
      RECEIPT_VERIFICATION_FAILURE.UNKNOWN_CANONICALIZATION_PROFILE
    );

    const unsupported = {
      ...legacyFixture.receipt,
      identity: { ...legacyFixture.receipt.identity, receiptVersion: "2.0.0" }
    } as unknown as VerifiableBenchmarkExecutionReceipt;
    expect(issuer.verifyReceipt(unsupported).errors.join(" ")).toContain(
      RECEIPT_VERIFICATION_FAILURE.LEGACY_RECEIPT_UNSUPPORTED
    );
  });

  it("fails closed instead of throwing for a V1 payload outside the portable domain", () => {
    const unsupported = asUntrusted(v1Fixture.receipt, {
      financial: { ...v1Fixture.receipt.financial, totalGrossCostUsd: 0.25 }
    });
    const result = issuer.verifyReceipt(unsupported);
    expect(result.isValid).toBe(false);
    expect(result.errors.join(" ")).toContain(
      RECEIPT_VERIFICATION_FAILURE.UNSUPPORTED_CANONICALIZATION_VALUE
    );
  });
});
