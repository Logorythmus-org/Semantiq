# ADR-0038: Multilingual Search Normalization

Status: Accepted

Date: 2026-07-13

## Context

Equivalent Persian text can contain Arabic `yeh` or `kaf`, non-breaking spaces, or zero-width non-joiners. Case and Unicode composition also affect deterministic matching. Destructive rewriting would corrupt canonical Question text.

## Decision

Normalize only the search representation and incoming query: Unicode NFKC, lowercase, Arabic/Persian yeh and kaf canonicalization, zero-width/non-breaking space conversion, tatweel removal, whitespace collapse, and trim. Preserve punctuation, digits, umlauts, and all original Question text.

## Consequences

Tested Persian character variants and case differences match reliably. German umlauts remain meaning-bearing characters. Arabic/Persian digits are not folded, and no stemming, transliteration, translation, diacritic stripping, or language inference is performed.
