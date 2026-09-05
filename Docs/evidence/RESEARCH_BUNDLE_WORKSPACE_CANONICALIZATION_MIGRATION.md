# ResearchBundle Workspace Canonicalization Migration

## 1. Scope

This record covers only the Core ResearchBundle component at `workspace/snapshot.json`. New explicitly opted-in components can use `semantiq-canonical-json-v1`; the legacy default remains unchanged.

## 2. Why workspace component migrated second

The component has one TypeScript producer and verifier, a fixed-shape payload inside the V1 portable domain, and an independently testable digest that feeds—but does not define—the parent root framing.

## 3. Legacy component behavior

Artifact version `1.0.0`, the exact workspace path, and absent component canonicalization metadata select the legacy path once. The stored legacy bytes are hashed directly with SHA-256. Existing components, digests, and roots are not rewritten.

## 4. V1 component behavior

The explicit builder option `workspaceSnapshotCanonicalization: "semantiq-canonical-json-v1"` stores the snapshot as exact V1 canonical JSON and hashes a profile-bound identity preimage. Unsupported values fail; generation never falls back to legacy.

## 5. Component profile metadata

The workspace entry in both `manifest.componentArtifacts` and `bundle.includedArtifacts` may contain:

```json
{
  "canonicalization": {
    "profile": "semantiq-canonical-json-v1",
    "hashAlgorithm": "sha256"
  }
}
```

The object is closed. It is optional only so legacy artifacts remain valid.

## 6. Legacy identification

Legacy eligibility requires all three conditions:

1. ResearchBundle artifact version `1.0.0`;
2. component path `workspace/snapshot.json`;
3. no `canonicalization` property.

Malformed or empty metadata is not absence and never selects legacy.

## 7. Verification dispatch

The verifier selects exactly one path before digest acceptance:

- valid V1 metadata → parse exact stored payload, require V1-canonical payload bytes, hash the V1 identity preimage once;
- bounded metadata-absent legacy component → hash exact stored legacy bytes once;
- any other profile, algorithm, version, path, or metadata shape → fail closed.

No serializer probing or match-based profile inference occurs.

## 8. V1 payload domain

V1 supports null, booleans, strings with valid Unicode, safe integers other than negative zero, arrays, and plain objects composed from those values. Fractional or unsafe numbers, NaN, infinity, undefined, cycles, symbol/accessor/non-enumerable properties, non-plain objects, and unpaired surrogates are rejected.

## 9. Parent root framing

The ResearchBundle root remains SHA-256 over lexically sorted `path:digest` entries joined with `|`. The root function, separator, sorting, and version metadata did not migrate.

## 10. Mixed-profile children

A V1 workspace child may coexist with legacy non-workspace children. The workspace entry declares its profile; unmigrated children retain their existing digest behavior. The root consumes only the verified recorded child digests and is not globally labeled V1.

## 11. Downgrade protection

### Profile-Stripping Threat and Resolution

Prompt 19 initially stopped after proving that metadata-only discrimination was unsafe. For the fixed ASCII-key snapshot, legacy and V1 payload bytes—and therefore unbound payload digests—were identical. Removing optional metadata could restore apparently valid legacy identity because neither the digest nor root committed the profile.

Prompt 19B uses this V1 identity preimage:

```json
{
  "canonicalization": {
    "profile": "semantiq-canonical-json-v1",
    "hashAlgorithm": "sha256"
  },
  "componentPath": "workspace/snapshot.json",
  "payload": "<exact WorkspaceSnapshot object>"
}
```

The envelope is canonicalized with V1 and hashed with SHA-256. Profile, algorithm, and path are therefore cryptographically bound. Removing metadata selects the single legacy calculation, whose payload-only digest cannot equal the envelope-bound V1 digest. The checked-in attack vector freezes this failure as `COMPONENT_DIGEST_MISMATCH`.

## 12. Fixed fixtures

The legacy fixture freezes semantic payload, exact bytes, SHA-256, component entry, root input, root, and successful verification. The V1 fixture additionally freezes the identity envelope and canonical bytes. The attack fixture removes only the metadata and requires failure.

## 13. Root-cascade evidence

With identical non-workspace children, the legacy and V1 root inputs differ only in the workspace `path:digest` entry. New root values differ because the child digest changes; the root algorithm does not.

## 14. Cross-language reference parity

The Python V1 reference independently canonicalizes and hashes the fixed identity envelope to the same bytes and SHA-256 as TypeScript. This is `REFERENCE_PARITY`, not Python ResearchBundle product support.

## 15. Reproduction

Run:

```bash
pnpm test -- tests/unit/research-bundle-workspace-snapshot-canonicalization.test.ts
python -m pytest packages/python/tests/test_canonicalization_profiles.py
pnpm conformance:canonical-json
```

The fixtures contain no private data and can be inspected without network services.

## 16. Security/forensic boundary

Unknown profiles, malformed metadata, unsupported algorithms, profile substitution, path replay, payload/digest/root mutation, and artifact-version mutation fail closed. Historical artifacts are never relabeled or rehashed. Bundle integrity proves provenance/integrity, not truth.

## 17. What changed

- Additive V1 workspace opt-in
- Optional closed metadata on workspace component entries
- Profile-, algorithm-, and path-bound V1 digest preimage
- Explicit component verification dispatch and normalized failures
- Fixed legacy, V1, and profile-stripping fixtures
- TypeScript tests and Python reference parity
- Additive product-contract schema/type support

## 18. What did not change

The ResearchBundle container and root canonicalization have NOT migrated. Legacy defaults, non-workspace digest code, root framing, receipt behavior, scoring, benchmark semantics, dependencies, package versions, releases, and historical artifacts remain unchanged.

## 19. Deferred ResearchBundle identities

Deferred surfaces include Core run/evaluation/claim/evidence/statistical/robustness components, the Core root, TypeScript SDK components/root, and Python SDK components/root.

## 20. Rollback model

Stop requesting the V1 builder option. Existing V1 verification and bounded legacy verification remain available. No historical rewrite or root-algorithm rollback is required.
