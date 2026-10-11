import { generateKeyPairSync, sign, verify, type KeyObject } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  canonicalizeV1,
  computeSha256
} from "../../packages/sandbox-contracts/src/index.js";

/**
 * RFC #196, Phase 5: standalone, OFFLINE, TEST-ONLY chain-of-custody sketch.
 * Does not replace or integrate with any production SemantIQ signature,
 * evidence format, key manager, or verification protocol.
 */
interface SyntheticCommitment {
  domain: "semantiq.observation.public-summary";
  version: "proposal-0";
  disclosureScope: "public-summary";
  issuerKeyId: string;
  publicRunId: string;
  result: { exitCode: number; timedOut: boolean };
}

interface SignedFixture {
  commitment: SyntheticCommitment;
  signatureHex: string;
}

interface TrustEntry {
  key: KeyObject;
  permitted: boolean;
}

function bytes(commitment: SyntheticCommitment): Buffer {
  return Buffer.from(canonicalizeV1(commitment), "utf8");
}

function issueFixture(commitment: SyntheticCommitment, privateKey: KeyObject): SignedFixture {
  return {
    commitment,
    signatureHex: sign(null, bytes(commitment), privateKey).toString("hex")
  };
}

function verifyAgainstPinnedKey(
  record: SignedFixture,
  pinnedKeys: ReadonlyMap<string, TrustEntry>
): boolean {
  const id = record.commitment.issuerKeyId;
  const trusted = pinnedKeys.get(id);
  if (!trusted || !trusted.permitted) return false;
  if (
    record.commitment.domain !== "semantiq.observation.public-summary" ||
    record.commitment.disclosureScope !== "public-summary" ||
    record.commitment.version !== "proposal-0"
  ) {
    return false;
  }
  if (!/^(?:[a-f0-9]{2})+$/.test(record.signatureHex)) return false;
  return verify(
    null,
    bytes(record.commitment),
    trusted.key,
    Buffer.from(record.signatureHex, "hex")
  );
}

const syntheticSubject = (issuerKeyId: string): SyntheticCommitment => ({
  domain: "semantiq.observation.public-summary",
  version: "proposal-0",
  disclosureScope: "public-summary",
  issuerKeyId,
  publicRunId: "synthetic-phase5-id",
  result: { exitCode: 0, timedOut: false }
});

describe("RFC #196 Phase 5 — independently pinned trust anchor (test-only)", () => {
  it("verifies a scoped synthetic commitment and rejects mutated content", () => {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    const pinned = new Map<string, TrustEntry>([
      ["reviewed-key-1", { key: publicKey, permitted: true }]
    ]);
    const issued = issueFixture(syntheticSubject("reviewed-key-1"), privateKey);

    expect(verifyAgainstPinnedKey(issued, pinned)).toBe(true);
    const modified: SignedFixture = {
      ...issued,
      commitment: {
        ...issued.commitment,
        result: { exitCode: 1, timedOut: false }
      }
    };
    expect(verifyAgainstPinnedKey(modified, pinned)).toBe(false);
  });

  it("rejects a different signer's key despite a self-consistent content digest", () => {
    const approved = generateKeyPairSync("ed25519");
    const unrelated = generateKeyPairSync("ed25519");
    const pinned = new Map<string, TrustEntry>([
      ["reviewed-key-1", { key: approved.publicKey, permitted: true }]
    ]);
    const record = issueFixture(syntheticSubject("reviewed-key-1"), unrelated.privateKey);

    // Content-only hashing is reproducible by anybody. No issuer identity follows.
    const untrustedHash = computeSha256(canonicalizeV1(record.commitment));
    expect(untrustedHash).toBe(computeSha256(canonicalizeV1(record.commitment)));
    expect(verifyAgainstPinnedKey(record, pinned)).toBe(false);
  });

  it("rejects unrecognized key IDs and a revoked authorization", () => {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    const issued = issueFixture(syntheticSubject("reviewed-key-1"), privateKey);
    const unknown = new Map<string, TrustEntry>();
    const revoked = new Map<string, TrustEntry>([
      ["reviewed-key-1", { key: publicKey, permitted: false }]
    ]);

    expect(verifyAgainstPinnedKey(issued, unknown)).toBe(false);
    expect(verifyAgainstPinnedKey(issued, revoked)).toBe(false);
  });

  it("does not trust public keys presented only inside an untrusted artifact", () => {
    const trusted = generateKeyPairSync("ed25519");
    const other = generateKeyPairSync("ed25519");
    const pinned = new Map<string, TrustEntry>([
      ["reviewed-key-1", { key: trusted.publicKey, permitted: true }]
    ]);

    const forgedRecord = issueFixture(syntheticSubject("reviewed-key-1"), other.privateKey);
    expect(verifyAgainstPinnedKey(forgedRecord, pinned)).toBe(false);
    // A verifier MUST NOT replace its separately trusted key with other.publicKey.
    expect(verify(null, bytes(forgedRecord.commitment), other.publicKey, Buffer.from(
      forgedRecord.signatureHex,
      "hex"
    ))).toBe(true);
  });
});
