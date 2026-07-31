# Question Multilingual Search

Prompt 5 explicitly validates English, German, Persian, and mixed Unicode storage through the same normalized substring strategy.

English and German comparisons are lowercased. German umlauts remain distinct characters: `ARCHITEKTUR` matches `Architektur`, while `ue` is not rewritten to `u` with an umlaut. No German stemming or compound-word analysis is claimed.

Persian search canonicalizes Arabic/Persian yeh (`ي`, `ى`, `ی`) and kaf (`ك`, `ک`) in the separate search representation. Zero-width non-joiner and non-breaking space become ordinary spaces, and repeated whitespace collapses. Canonical Question text remains byte-for-byte owned by the write model.

Arabic/Persian digits are preserved and are not considered equivalent. Diacritics, punctuation, and transliteration are not removed or expanded. NFKC may compose compatibility forms; no language detection, stemming, translation, or complete Persian NLP is performed.

Tests cover case variation, German umlauts, Persian character variants, Unicode normalization, punctuation/multiline-safe storage, current-state update synchronization, and archived visibility.
