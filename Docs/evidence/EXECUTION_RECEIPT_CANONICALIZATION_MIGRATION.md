# Execution-Receipt Canonicalization Migration

## 1. Scope

This record covers one identity surface: `receiptDigestSha256` on `VerifiableBenchmarkExecutionReceipt`, issued and verified by `BenchmarkExecutionReceiptIssuer`. Only explicitly requested new receipts in this family can use `semantiq-canonical-json-v1`.

## 2. Why this receipt migrated first

The receipt has one colocated TypeScript issuer/verifier pair, an existing `receiptVersion`, an additive metadata location, no checked-in production receipts, and focused verification tests. ResearchBundle and EvidencePackage contain multiple coupled identities and remain deferred.

## 3. Legacy behavior

A receipt with `identity.receiptVersion === "1.0.0"` and no `canonicalization` property is legacy. Its unsigned body excludes `receiptDigestSha256` and `signatureHex`, is serialized with the historical TypeScript `canonicalJson`, and is hashed with SHA-256. The checked-in legacy fixture freezes the exact text and digest.

## 4. V1 generation behavior

Callers explicitly request `semantiq-canonical-json-v1` through the additive issuance option. The issuer inserts canonicalization metadata, canonicalizes the complete unsigned body with the shared V1 implementation, encodes the returned text as UTF-8, and computes SHA-256. Omitting the option preserves the established legacy issuance default and rollback path.

V1 accepts only its documented portable value domain, including safe integers but not fractional numbers. An explicit V1 request outside that domain fails rather than changing receipt values or silently falling back.

## 5. Profile metadata

The optional property is adjacent to `identity`:

```json
{
  "canonicalization": {
    "profile": "semantiq-canonical-json-v1",
    "hashAlgorithm": "sha256"
  }
}
```

It is optional in the schema solely so schema version `1.0.0` legacy receipts remain valid. New V1 receipts always include both fields; extra, missing, empty, or malformed fields fail closed.

## 6. Digest coverage

The profile metadata is inside the unsigned body and is covered by `receiptDigestSha256`. The digest and signature fields remain outside to avoid a circular definition. Embedded artifact, evidence-bundle, Merkle-root, provenance, observation, financial, and compliance hashes retain their own existing semantics.

## 7. Verification dispatch

Verification selects exactly one path before comparing a digest:

1. Valid explicit V1 metadata uses V1 bytes.
2. Absent metadata plus receipt version `1.0.0` uses exact legacy bytes.
3. Every other metadata/version state fails closed.

The verifier never tries profiles until one happens to match.

## 8. Unknown profile behavior

Unknown profiles, malformed metadata, unsupported algorithms, unsupported values, and unsupported unprofiled receipt versions produce normalized failure categories. None is reinterpreted as legacy.

## 9. Downgrade protection

Removing metadata from a V1 receipt changes the unsigned body. The bounded legacy dispatcher then computes the legacy digest over the metadata-free body, which cannot match the stored V1 digest that covered metadata. Profile substitution and added fallback fields are rejected before hashing.

## 10. Legacy compatibility

The legacy fixture remains byte- and hash-identical, verifies through only the legacy branch, and is never rewritten during V1 issuance. Rollback can stop new V1 issuance without removing either verification path.

## 11. V1 fixtures

One synthetic representative V1 fixture records the complete receipt, exact canonical UTF-8 text, expected SHA-256 digest, metadata, and successful verification result. It uses only portable V1 values and is not external evidence.

## 12. Reproduction

From a frozen source checkout, run:

```bash
pnpm install --frozen-lockfile
pnpm exec vitest run tests/unit/execution-receipt-canonicalization.test.ts
pnpm conformance:canonical-json
```

The focused test reads both checked-in fixtures, recomputes exact bytes and digests, tests repeated issuance and insertion-order independence, and round-trips serialized metadata.

## 13. Security and forensic boundary

Payload mutation, digest mutation, profile substitution, algorithm mutation, metadata stripping, malformed metadata, unknown profiles, unsupported receipt versions, and legacy/V1 confusion are negative cases. Structured errors preserve the reason a receipt failed.

This is internal conformance evidence, not independent replication, external validation, certification, or proof that all SemantIQ hashes are cross-language deterministic.

## 14. What changed

- Added an explicit V1 issuance option for this receipt family.
- Added optional, self-describing canonicalization metadata.
- Added explicit V1/legacy verifier dispatch and fail-closed errors.
- Added fixed legacy and V1 fixtures plus migration regression tests.
- Recorded only this migration row as implemented.

## 15. What did not change

The receipt schema version, existing call signature, legacy default, identity payload fields, pseudo-signature format validation, benchmark/scoring behavior, embedded hash semantics, historical artifacts, dependencies, package versions, release/tag state, and publication state did not change.

## 16. Deferred Phase-2 surfaces

ResearchBundle hashes and roots, EvidencePackage components/roots/seals, provenance, preregistration, evaluation ledgers, public artifact hashes, provider records, and every other matrix row remain unmigrated. Only this receipt digest has migrated.
