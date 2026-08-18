# ADR-0137: 8-Vector Holistic Execution Cost Model and Ledger Architecture

**Status**: Accepted  
**Date**: 2026-08-15  

---

## Context

AI agent evaluation incurs multifaceted financial costs extending far beyond simple LLM token billing: sandbox virtualization duration, cold-boot VM instantiation surcharges, Playwright browser render sessions, GPU hardware allocations, storage disk/snapshot IOPS, network data transfer egress, external MCP/tool API calls, and secondary evaluation judge tokens.

To achieve complete financial transparency and protect research and enterprise budgets from unexpected overruns, SemantIQ requires an authoritative, holistic execution cost model.

---

## Decision

1. **8-Vector Cost Taxonomy**: Formalize 8 orthogonal cost dimensions: `INFERENCE`, `RUNTIME_COMPUTE`, `BROWSER_GUI`, `GPU_ACCELERATION`, `STORAGE_IO`, `NETWORK_BANDWIDTH`, `TOOL_INVOCATION`, and `EVALUATION_JUDGE`.
2. **Deterministic Ledger Engine**: Implement `ExecutionCostCalculator` to deterministically aggregate resource metrics and cost rates into a unified `HolisticExecutionCostLedger`.
3. **Cryptographic Financial Sealing**: Sign every cost ledger (`ledgerSignatureHex`) using canonical JSON SHA-256 digests (`computeSha256(canonicalJson(ledger))`).
4. **Grant Subsidy & Net Settlement**: Explicitly account for foundation grant subsidies (`grantSubsidiesUsd`) calculating net billed amounts (`totalNetCostUsd`).
5. **Decoupling from Evaluation Scoring**: Invariant: Benchmark scores are strictly independent of execution spend or financial ledger balances.

---

## Consequences

- Full financial transparency across all compute and inference dimensions.
- Eliminates hidden costs during multi-step, multi-agent, browser-heavy evaluations.
- Enables accurate departmental showback and grant reporting for research institutions.
