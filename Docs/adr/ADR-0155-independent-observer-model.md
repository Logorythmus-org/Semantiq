# ADR-0155: SemantIQ Independent Observer Architecture and Evidence-Source Calibration

**Status**: Accepted  
**Date**: 2026-08-15  

---

## Context

In AI evaluations, relying exclusively on agent self-reported logs or unverified execution provider metrics creates risks of self-serving bias, suppressed errors, or uncalibrated confidence. Evaluators require an independent observation system that captures out-of-band telemetry (PTY mirror, host eBPF probes, network taps, filesystem snapshot diffs) and explicitly labels each observation's evidence source and confidence score.

---

## Decision

1. **Six-Source Evidence Classification**:
   - `HOST_KERNEL_EBPF` (Confidence: 1.0)
   - `SOCKET_PTY_MIRROR` (Confidence: 1.0)
   - `NETWORK_BRIDGE_TAP` (Confidence: 1.0)
   - `FILESYSTEM_SNAPSHOT_DIFF` (Confidence: 0.95)
   - `PROVIDER_ADAPTER_API` (Confidence: 0.70)
   - `AGENT_SELF_REPORT` (Confidence: 0.30)
2. **Cross-Verification Engine**:
   - Cross-verifies provider adapter claims against host ground-truth telemetry, tagging `VERIFIED_BY_HOST`, `DISCREPANCY_DETECTED`, or `UNVERIFIABLE_CLAIM`.
3. **Independent Observer Engine**: Implement `IndependentObserverEngine` to record observations, bundle them into `IndependentObservationBundle`, calculate `overallObservationTrustScore`, and issue cryptographically signed bundles (`observerSignatureHex`).
4. **Observable Behavioral Grounding**: Invariant: The Independent Observer monitors the 7-stage chain (`Context → Interpretation → Decision → Action → Result → Consequence → Recovery`) using external physical traces without assuming internal mental states.

---

## Consequences

- Ground-truth evidence is separated from untrusted agent and provider self-reporting.
- Evaluators and audit tools can filter or weight evidence by calibrated trust confidence.
- Cryptographic observer signatures prevent tampering with captured out-of-band telemetry.
