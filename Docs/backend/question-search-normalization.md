# Question Search Normalization

The JavaScript query normalizer and PostgreSQL generated-column function apply the same deterministic sequence:

1. Unicode NFKC normalization
2. lowercase conversion
3. Arabic yeh variants to Persian yeh
4. Arabic kaf to Persian kaf
5. tatweel removal
6. zero-width non-joiner and non-breaking space to ordinary space
7. whitespace collapse and trim

Normalization applies only to incoming search text and the generated `search_text` representation. `questions.text`, revisions, events, and API output retain original text.

The boundary deliberately preserves punctuation, digits, diacritics, language, and meaning-bearing characters. It performs no stemming, token deletion, transliteration, translation, synonyms, spelling correction, or LLM rewriting. Search inputs containing unsafe control/bidirectional formatting characters are rejected; inputs are bounded to 200 Unicode code points before and after normalization.

Normalization can create intentional equivalence collisions, such as Arabic and Persian kaf. Search is discovery, not identity: results are still identified by Question ID and original text.
