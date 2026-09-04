# Canonical JSON fixtures

The `v1/vectors.json` file contains fixed semantic inputs, canonical UTF-8 text and hex, SHA-256 digests, and explicit out-of-domain cases for `semantiq-canonical-json-v1`.

The `legacy/` fixtures freeze the smallest known TypeScript/Python divergence so historical verification behavior cannot be changed accidentally. Tests never regenerate these expectations at runtime.

See [`Docs/evidence/CANONICALIZATION_PROFILES.md`](../../../Docs/evidence/CANONICALIZATION_PROFILES.md) for the normative project contract and evidence limitations.
