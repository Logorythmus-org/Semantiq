# Canonicalization Profiles

## 1. Why profiles exist

Canonicalization defines evidence identity: the same supported semantic JSON value must map to the same UTF-8 bytes before SHA-256 is calculated. A verifier must know the profile explicitly; digest matching is not a safe profile-discovery mechanism.

## 2. Prompt-15 divergence

The active TypeScript and Python SDK implementations historically used different serialization rules. For `{"b":2,"a":1}`, TypeScript produced `{"a":1,"b":2}` while Python produced `{"a": 1, "b": 2}`. Their bytes and hashes therefore differ. This is a compatibility fact, not a test defect.

## 3. Legacy TypeScript profile

`legacy-ts-v0` preserves the existing `canonicalJson` behavior for verification:

- recursively removes `undefined` object properties;
- preserves array order;
- sorts object keys with JavaScript `String.localeCompare`;
- emits compact `JSON.stringify` scalar syntax;
- uses JavaScript number serialization;
- hashes the UTF-8 encoding as lowercase hexadecimal SHA-256.

The function is unchanged. This qualified legacy profile is not a cross-language contract.

## 4. Legacy Python profile

`legacy-python-v0` preserves `json.dumps(value, sort_keys=True)`:

- recursively sorts string keys;
- uses Python's default comma/colon separators, including spaces;
- defaults to `ensure_ascii=True`;
- uses Python JSON number rendering;
- hashes the resulting UTF-8 bytes as lowercase hexadecimal SHA-256.

The existing `compute_sha256` behavior is unchanged. This profile is not cross-language.

## 5. Shared v1 contract

`semantiq-canonical-json-v1` is an additive, opt-in internal profile. It accepts only:

- `null` and booleans;
- Unicode strings without unpaired surrogates;
- integers from `-9007199254740991` through `9007199254740991`;
- arrays of supported values, preserving element order;
- plain objects with enumerable string-valued keys and supported values.

Objects are compactly serialized after sorting keys by ascending Unicode scalar-value sequence. Unsupported inputs fail explicitly.

## 6. RFC 8785/JCS relationship

Shared v1 is **not RFC 8785/JCS compliant**. It is a narrower SemantIQ-specific profile: floating-point values are excluded, keys use Unicode scalar-value ordering rather than JCS's UTF-16 ordering rule, and no claim is made for the complete I-JSON/JCS domain. The narrow profile reduces cross-runtime ambiguity without adding a new dependency or overstating interoperability.

## 7. Numeric policy

Supported numbers are integers in the inclusive JavaScript safe-integer range. Floating-point values, negative zero, integers outside that range, `NaN`, positive infinity, and negative infinity are out of domain and fail. No coercion, rounding, exponent rewriting, or trailing-zero normalization occurs.

## 8. Unicode policy

Strings and keys are encoded as UTF-8. JSON-required escaping applies to quotation marks, reverse solidus, and control characters. Non-Latin text and emoji remain literal UTF-8. Unpaired surrogates fail.

No NFC or NFD normalization occurs. Visually equivalent but canonically distinct sequences intentionally produce different bytes and digests.

## 9. Ordering policy

Array order is preserved. Object keys are ordered lexicographically by their Unicode scalar-value sequences at every nesting depth. Input insertion order does not affect V1 output.

## 10. Hash representation

SHA-256 is calculated over the exact canonical UTF-8 bytes. Digests are 64-character lowercase hexadecimal strings without a prefix. APIs return the profile and algorithm alongside the digest.

## 11. Profile metadata

New V1 hash results carry:

```json
{
  "canonicalization": {
    "profile": "semantiq-canonical-json-v1",
    "hashAlgorithm": "sha256"
  }
}
```

Existing evidence artifacts are not retroactively tagged. Future artifact-schema migration must place equivalent metadata in a reviewed, identity-covered location.

## 12. Generation rules

Callers must select the profile explicitly. Prompt 15B does not change generation defaults on existing evidence surfaces. Shared V1 remains opt-in/internal until each artifact contract is separately migrated.

## 13. Verification rules

Verification must dispatch on trusted profile metadata. Unknown profiles fail closed. Verifiers must not try profiles until a digest happens to match, infer V1 from missing metadata, or silently downgrade from V1 to a legacy profile.

## 14. Legacy compatibility

Historical artifacts and hashes remain untouched. Explicit legacy verification reproduces their historical serializer. Where old artifacts lack profile metadata, a caller must provide an explicit compatibility mode based on documented artifact/producer history; absence of metadata is never interpreted as V1.

Minimal legacy vectors preserve both confirmed historical byte sequences and digests.

## 15. Migration model

- **Phase 0 — preserved:** divergent legacy generation and verification remain unchanged.
- **Phase 1 — implemented here:** shared V1 APIs, registry, fixed vectors, and CI conformance are opt-in/internal.
- **Phase 2 — future review:** selected new evidence artifacts carry identity-covered profile metadata.
- **Phase 3 — future review:** V1 may become the default only for newly created, explicitly versioned evidence.
- **Phase 4 — future review:** legacy generation may be deprecated; legacy verification remains.

No dates or automatic transitions are implied.

## 16. Compatibility warning

**Canonicalization profile changes alter identity hashes.** Changes to ordering, numeric handling, Unicode treatment, escaping, encoding, or whitespace require a new profile or an explicit compatibility review. Historical roots must not be rewritten.

## 17. Evidence boundary

The checked-in vectors establish owner-controlled internal cross-language conformance for the bounded V1 domain. The Python implementation is independent, and the Node hash path independently checks fixed bytes. Expected bytes and digests are checked in rather than generated during tests.

This is not external validation, certification, formal standardization, product adoption, or proof that legacy TypeScript and Python evidence identities agree.

## 18. What this does NOT establish

Prompt 15B does not:

- migrate any existing evidence, receipt, manifest, or ResearchBundle;
- make V1 the default;
- add profile metadata to existing public schemas;
- establish RFC 8785/JCS compliance;
- validate arbitrary floating-point JSON;
- authorize outreach or publication.

## Reproduction

From a source checkout with Node.js 22, pnpm, and Python 3.10 or newer:

```bash
pnpm conformance:canonical-json
```

The command verifies 20 supported and 7 out-of-domain vectors, both legacy regression vectors, fixed byte/digest expectations, the independent Python implementation, and deterministic normalized results.
