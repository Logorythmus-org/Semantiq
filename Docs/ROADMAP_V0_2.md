# Evidence-Driven Roadmap (Version 0.2.0-beta.1)

**Project**: SemantIQ Benchmarks  
**Milestone**: Public Beta (`0.2.0-beta.1`)  
**Target Release**: Q4 2026  
**License**: CC0-1.0 Universal / MIT / CC-BY-4.0  

---

## 1. Roadmap Principles

Every item in this roadmap is justified by empirical audit evidence from Phase 6 and Phase 7 evaluations. No feature is added based on unverified preference.

---

## 2. Evidence-Based Milestone Plan

### Milestone 1: Multi-Worker Parallel Evaluation (Priority: HIGH | Cost: MEDIUM)
- **Evidence**: Empirical audit showed local single-threaded evaluation bottlenecking on large 100+ subject benchmark packs.
- **Deliverable**: Distributed evaluation worker pool in `packages/alpha-runtime`.

### Milestone 2: Cryptographic Score Attestation Ledger (Priority: HIGH | Cost: LOW)
- **Evidence**: Scholarly integrity audits (Prompt 6.17 / Prompt 7.5) require verifiable score attestations for public leaderboards.
- **Deliverable**: SHA-256 HMAC & ECDSA signed evaluation report attestations in `@tech-club/semantiq`.

### Milestone 3: Enterprise Provider Plugin SDK (Priority: MEDIUM | Cost: LOW)
- **Evidence**: Community requests (Prompt 7.6 / 7.7) require custom enterprise LLM backend connectors (vLLM, Groq, Mistral).
- **Deliverable**: Pluggable connector SDK interface re-exported in `packages/semantiq/src/index.ts`.
