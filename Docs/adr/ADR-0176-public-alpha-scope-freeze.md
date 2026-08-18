# ADR-0176: Public Alpha Scope Freeze (Prompt 03)

## Status
Accepted

## Context
To prepare SemantIQ for public alpha release (`v0.1.0-alpha.1`), the release boundary must be frozen to the smallest credible, self-contained set of capabilities. Clear demarcation between supported, experimental, optional, deferred, and out-of-scope features prevents scope creep and ensures complete test verification.

## Decision
1. **Freeze Supported Alpha Scope**:
   - Supported Core includes: Benchmark DSL, SPIS Execution Contracts, 7-Stage Behavioral Sequence (`Context → Recovery`), Independent Observer & PTY Mirror, Anti-Gaming Anomaly Detector, Merkle Trace Immutability, Provider Router, Local Offline CLI Runner, Local OCI / Mock Reference Adapters, and Canonical Report Generators.
2. **Classify Experimental Features**:
   - Long-horizon planning scenarios, transition phenomena laboratory, multi-agent sandbox scenarios, and browser GUI stubs are labeled as experimental alpha previews.
3. **Classify Optional Integrations**:
   - OpenSandbox daemon adapter, PostgreSQL relational storage, and commercial cloud base adapters are strictly optional plug-ins.
4. **Segregate Future Roadmap**:
   - Distributed multi-cloud scheduling and hosted SaaS dashboards are deferred to Phase 13+.
   - Planetary civilization OS and cryptocurrency systems are declared out of scope for the alpha release.

## Consequences
- Clean, focused, and thoroughly tested alpha release scope.
- Zero risk of unverified experimental features blocking release authorization.
- Verdict: `PASS`.
