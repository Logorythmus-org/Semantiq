# SemantIQ Sandbox Specification: Open and Commercial Provider Model

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 31)  
**Status**: Approved Specification  
**Date**: 2026-08-15

---

## 1. Executive Summary

AI agent benchmarking requires executing untrusted, dynamic, and state-modifying code across a broad spectrum of infrastructure environments: from local developer machines running open-source container daemons, to academic clusters running self-hosted microVMs, to managed multi-tenant commercial cloud sandbox providers, and secure air-gapped enterprise environments.

SemantIQ evaluates agent reasoning and observable behavior across the standard pipeline:
`Benchmark → Scenario → Execution Contract → Provider Router → Provider Adapter → Runtime → Observation → Evidence → Evaluation → Report`

This specification defines the **Unified Open and Commercial Provider Model**:

1. **Universal Provider Neutrality**: SemantIQ Core remains strictly decoupled from runtime implementations. No runtime (commercial or open-source) is mandatory or privileged.
2. **Standardized Provider Taxonomy**: Unifies all execution platforms into 5 explicit hosting categories (`LOCAL_OPEN_SOURCE`, `SELF_HOSTED_DEDICATED`, `COMMERCIAL_MANAGED_CLOUD`, `ENTERPRISE_PRIVATE_AIRGAPPED`, `DETERMINISTIC_REPLAY`).
3. **Machine-Readable Metadata & Cost Modeling**: Enforces transparent disclosure of SPDX licensing terms, per-second/per-minute billing rates, zero data retention confirmation, and hardware isolation tiers via `ProviderEcosystemDescriptor` and `CostAttributionRecord`.
4. **Clean-Room License & Extension Boundaries**: Guarantees that vendor-specific runtime extensions, proprietary telemetry, and copyleft licenses (e.g. AGPL-3.0) remain isolated in adapter boundaries without contaminating SemantIQ Core or distorting canonical benchmark semantics.

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                    SemantIQ Core Engine                                     |
|  [Benchmark Definition] ──> [Execution Contract] ──> [Provider Router] ──> [Evidence & Eval]|
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Standardized ISandboxProvider Interface)
                        ┌───────────────────────┼───────────────────────┐
                        ▼                       ▼                       ▼
           ┌────────────────────────┐┌────────────────────┐┌────────────────────────┐
           |   Local / Open-Source  || Commercial Cloud   ||  Enterprise Air-Gapped |
           | (Docker, Podman, OCI)  ||  (E2B, Modal, etc) || (Private MicroVM Clust)|
           └────────────────────────┘└────────────────────┘└────────────────────────┘
```

---

## 2. Scope

- **Unified Provider Taxonomy**: Defining formal descriptors for free open-source, self-hosted, commercial managed, and enterprise air-gapped runtimes.
- **Machine-Readable Metadata**: Standardizing schemas for provider licensing, billing models, privacy profiles, capabilities, and extension boundaries.
- **Deterministic Cost Attribution**: Computing reproducible execution and egress cost records for every benchmark run.
- **Privacy & Data Governance**: Enforcing verifiable zero data retention and ephemeral volume scrubbing for cloud and enterprise providers.
- **Clean-Room Boundary Isolation**: Ensuring third-party proprietary SDKs or copyleft runtimes communicate across network RPC or process CLI boundaries without linking into SemantIQ Core.
- **Deterministic Behavioral Observation**: Capturing the canonical behavioral chain (`Context → Interpretation → Decision → Action → Result → Consequence → Recovery`) identically across all execution backends.

---

## 3. Non-Goals

- **No OpenSandbox Fork or Clone**: SemantIQ does not fork, duplicate, or maintain a proprietary copy of OpenSandbox or any external runtime codebase.
- **No Mandatory Commercial Provider**: SemantIQ never requires an internet connection, API keys, or paid subscriptions for standard benchmark execution.
- **No Vendor Telemetry Ingestion into Core**: SemantIQ Core never collects or aggregates proprietary vendor analytics.
- **No Legal Legal Advice / Warranty Claims**: SPDX and licensing metadata are recorded as machine-readable technical facts without asserting formal legal conclusions.

---

## 4. Architecture & Responsibility Separation

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 SEMANTIQ-OWNED RESPONSIBILITIES                             |
|  • Canonical Benchmark Definitions & Scenarios                                              |
|  • Universal Execution Contracts (EnvironmentSpec, ExecutionRequest, ExecutionResult)        |
|  • Provider-Neutral Observation (ISandboxObserver: Stdout, Stderr, Filesystem, Sockets)     |
|  • Behavioral Evaluation Chain (Context -> Decision -> Action -> Result -> Consequence)     |
|  • Cryptographic Provenance Generation & Merkle Hash Verification                           |
|  • Provider Selection Router & Fallback Orchestration                                       |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Pluggable Adapter Layer)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                  ADAPTER-OWNED BOUNDARY                                     |
|  • Mapping EnvironmentSpec to Provider-Native API (Docker Engine API, E2B SDK, MicroVM)     |
|  • Managing Authentication Credentials Outside Benchmark Payloads                           |
|  • Isolating Provider-Specific Extensions (GPU Hooks, Vendor Telemetry)                     |
|  • Emitting Standardized State Deltas & Cost Attribution Metadata                          |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Subprocess / Network RPC Boundary)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                 PROVIDER-OWNED RESPONSIBILITIES                             |
|  • Physical Compute & Virtualization (cgroups v2, MicroVMs, KVM, Firecracker, gVisor)       |
|  • Syscall Execution & Signal Forwarding (SIGINT, SIGTERM, SIGKILL)                         |
|  • Resource Limits Enforcement (CPU Quotas, Memory Caps, Disk Quotas, Process Limits)        |
|  • Ephemeral Volume Scrubbing & Zero Residual State Guarantee                               |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

### 4.1 Strict Invariant Matrix

| Invariant                   | SemantIQ Core                  | Adapter Layer                | Execution Provider |
| :-------------------------- | :----------------------------- | :--------------------------- | :----------------- |
| **Benchmark Semantics**     | Defines canonical ground truth | Pure passthrough             | No influence       |
| **Vendor SDK Dependencies** | Zero external runtime imports  | Encapsulates vendor client   | Native execution   |
| **Licensing**               | Permissive (MIT / Apache-2.0)  | Provider-matched             | Vendor-defined     |
| **Cost Attribution**        | Normalizes & audits records    | Calculates unit cost         | Invoices usage     |
| **State Verification**      | Merkle root & SHA-256 diffs    | Extracts raw filesystem diff | Executes mutations |

---

## 5. Data & Event Schemas

### 5.1 Provider Ecosystem Descriptor Schema (`schemas/provider-model.schema.json`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ProviderEcosystemDescriptor",
  "type": "object",
  "required": [
    "providerId",
    "displayName",
    "version",
    "hostingCategory",
    "license",
    "costStructure",
    "privacyProfile",
    "trustTier",
    "securityGrade",
    "capabilities",
    "extensionMatrix",
    "registeredAt"
  ],
  "properties": {
    "providerId": { "type": "string" },
    "displayName": { "type": "string" },
    "version": { "type": "string" },
    "hostingCategory": {
      "type": "string",
      "enum": [
        "LOCAL_OPEN_SOURCE",
        "SELF_HOSTED_DEDICATED",
        "COMMERCIAL_MANAGED_CLOUD",
        "ENTERPRISE_PRIVATE_AIRGAPPED",
        "DETERMINISTIC_REPLAY"
      ]
    },
    "license": {
      "type": "object",
      "required": [
        "spdxId",
        "licenseName",
        "isOsiApproved",
        "isCommercialUseAllowed",
        "copyleftClause"
      ],
      "properties": {
        "spdxId": { "type": "string" },
        "licenseName": { "type": "string" },
        "isOsiApproved": { "type": "boolean" },
        "isCommercialUseAllowed": { "type": "boolean" },
        "copyleftClause": { "type": "boolean" },
        "termsUrl": { "type": "string" }
      }
    },
    "costStructure": {
      "type": "object",
      "required": ["billingModel", "baseRatePerUnit", "currency", "minBillingDurationSeconds"],
      "properties": {
        "billingModel": {
          "type": "string",
          "enum": [
            "FREE_LOCAL",
            "PER_SECOND",
            "PER_MINUTE",
            "PER_INSTANCE_HOUR",
            "SUBSCRIPTION_TIER",
            "FIXED_PER_RUN"
          ]
        },
        "baseRatePerUnit": { "type": "number", "minimum": 0 },
        "currency": { "type": "string", "enum": ["USD", "EUR", "GBP", "NONE"] },
        "minBillingDurationSeconds": { "type": "integer", "minimum": 0 },
        "networkEgressRatePerGb": { "type": "number" },
        "idleTimeoutSeconds": { "type": "integer" }
      }
    },
    "privacyProfile": {
      "type": "object",
      "required": [
        "zeroDataRetentionConfirmed",
        "dataStorageRegion",
        "telemetryPolicy",
        "retentionPolicy",
        "ephemeralWipeVerified",
        "complianceAttestations"
      ],
      "properties": {
        "zeroDataRetentionConfirmed": { "type": "boolean" },
        "dataStorageRegion": { "type": "string" },
        "telemetryPolicy": {
          "type": "string",
          "enum": ["NO_TELEMETRY", "ANONYMIZED_METRICS", "FULL_TELEMETRY"]
        },
        "retentionPolicy": {
          "type": "string",
          "enum": [
            "EPHEMERAL_ZERO_RETENTION",
            "VOLATILE_UNTIL_TERMINATION",
            "HOST_LOGS_RETAINED_30_DAYS",
            "PERSISTENT_STORAGE"
          ]
        },
        "ephemeralWipeVerified": { "type": "boolean" },
        "complianceAttestations": { "type": "array", "items": { "type": "string" } }
      }
    },
    "trustTier": {
      "type": "string",
      "enum": ["UNVERIFIED", "SELF_ATTESTED", "TCK_VERIFIED", "CRYPTOGRAPHICALLY_CERTIFIED"]
    },
    "securityGrade": {
      "type": "string",
      "enum": ["A_HARDENED_MICROVM", "B_ISOLATED_CONTAINER", "C_RESTRICTED_PROCESS", "F_UNCONFINED"]
    },
    "capabilities": { "type": "object" },
    "extensionMatrix": {
      "type": "object",
      "required": [
        "supportsCustomTelemetry",
        "supportsGpuAcceleration",
        "supportsMemorySnapshots",
        "supportsNetworkInterception",
        "isolatedFromBenchmarkSemantics"
      ],
      "properties": {
        "supportsCustomTelemetry": { "type": "boolean" },
        "supportsGpuAcceleration": { "type": "boolean" },
        "supportsMemorySnapshots": { "type": "boolean" },
        "supportsNetworkInterception": { "type": "boolean" },
        "vendorExtensionNamespace": { "type": "string" },
        "isolatedFromBenchmarkSemantics": { "type": "boolean" }
      }
    },
    "registeredAt": { "type": "string" }
  }
}
```

### 5.2 Cost Attribution Record Schema (`schemas/cost-attribution-record.json`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CostAttributionRecord",
  "type": "object",
  "required": [
    "attributionId",
    "providerId",
    "instanceId",
    "executionDurationMs",
    "billedDurationMs",
    "computeCost",
    "egressCost",
    "totalCost",
    "currency",
    "billingModel",
    "timestamp"
  ],
  "properties": {
    "attributionId": { "type": "string" },
    "providerId": { "type": "string" },
    "instanceId": { "type": "string" },
    "executionDurationMs": { "type": "integer" },
    "billedDurationMs": { "type": "integer" },
    "computeCost": { "type": "number" },
    "egressCost": { "type": "number" },
    "totalCost": { "type": "number" },
    "currency": { "type": "string" },
    "billingModel": { "type": "string" },
    "timestamp": { "type": "string" }
  }
}
```

---

## 6. User and Provider Lifecycle Flow

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                    1. Provider Registration                                 |
|  Provider submits ProviderEcosystemDescriptor with SPDX license, cost model, and privacy.  |
|  ProviderModelAuditor verifies descriptor and validates extension isolation.               |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                    2. Benchmark Dispatch                                    |
|  User selects benchmark scenario or lets Provider Router select optimal backend:            |
|  - Offline / Dev:    LOCAL_OPEN_SOURCE or DETERMINISTIC_REPLAY (Zero cost)                  |
|  - Scale Research:   COMMERCIAL_MANAGED_CLOUD (High parallelism, cost tracked)             |
|  - Regulated Sector: ENTERPRISE_PRIVATE_AIRGAPPED (Zero data retention, airgapped)          |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                    3. Isolated Execution                                    |
|  Adapter translates EnvironmentSpec. Provider launches sandbox.                             |
|  ISandboxObserver captures stdout, stderr, process spawn/exit, and filesystem diffs.       |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                               4. Teardown & Cost Attribution                                |
|  Provider wipes ephemeral volumes. ProviderModelAuditor computes CostAttributionRecord.    |
|  SemantIQ packages execution evidence, Merkle hashes, and cost into sealed EvaluationReport.|
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 7. Security, Privacy, and Trust Boundaries

1. **Zero Data Retention Enforcement**: Commercial cloud providers must formally declare `zeroDataRetentionConfirmed = true` and `retentionPolicy = 'EPHEMERAL_ZERO_RETENTION'`. Cloud providers failing this check are disqualified from running sensitive benchmark tiers.
2. **Ephemeral Volume Scrubbing**: Prior to container/microVM destruction, ephemeral storage volumes must be wiped to prevent data residue between sequential agent runs.
3. **Air-Gapped Isolation**: Enterprise providers operating in `ENTERPRISE_PRIVATE_AIRGAPPED` mode disable all external DNS resolution and default gateways, routing only through private VPC endpoints if explicitly whitelisted.
4. **Cryptographic Identity Verification**: As defined in ADR-0130, provider identities and TCK conformance are signed with public/private keypairs, ensuring evaluation authenticity.

---

## 8. Open-Source vs. Commercial Paths

### 8.1 Open-Source Path (Local-First Default)

- **Runtimes**: Docker Engine, Podman, containerd, Firecracker, runc.
- **Cost**: Zero compute fees (`billingModel: 'FREE_LOCAL'`).
- **Network**: Fully offline capable (`offlineOnly: true`).
- **Telemetry**: Zero external network telemetry transmitted.
- **Portability**: Complete evaluation suite runs entirely on a single developer laptop or self-hosted CI runner.

### 8.2 Commercial & Managed Cloud Path

- **Runtimes**: E2B, Modal, Fly.io Machines, Daytona, RunPod, Blaxel.
- **Cost**: Granular per-second or per-minute billing with transparent spend limits (`CloudBudgetPolicy`).
- **Scalability**: Instant spin-up of hundreds of parallel microVMs for large benchmark sweeps.
- **Verification**: Automatic generation of `CostAttributionRecord` for budgeting and financial auditing.

### 8.3 Enterprise Private & Air-Gapped Path

- **Runtimes**: On-premise Kubernetes clusters with Kata Containers, gVisor, or dedicated Bare-Metal MicroVMs.
- **Security**: Strict zero-retention, hardware TPM attestation, custom HSM key management, and air-gapped network policies.
- **Compliance**: SOC 2 Type II, ISO 27001, and HIPAA compliance mapping.

---

## 9. Licensing and Compliance Boundaries

SemantIQ establishes a rigorous **Clean-Room License Architecture**:

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                               SemantIQ Core (MIT / Apache-2.0)                              |
|   Strictly permissive codebase. Zero proprietary or copyleft (GPL/AGPL) code in core.      |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Network API / Process CLI Boundary)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                         External Execution Providers & Adapters                             |
|  • Docker / Podman (Apache-2.0 / GPL-2.0 CLI) ──> Communicates via Docker Engine API / CLI  |
|  • OpenSandbox (Apache-2.0)                   ──> Communicates via gRPC / REST API          |
|  • E2B / Cloud Runtimes (Commercial / SDK)    ──> Communicates via Official Open-Source SDK |
|  • Linux Kernel / KVM (GPL-2.0)               ──> Communicates via Kernel Syscall Boundary  |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

- **No Copyleft Ingestion**: Runtimes licensed under AGPL or GPL operate strictly on the other side of an RPC or CLI boundary. No static or dynamic linking of copyleft code into SemantIQ Core libraries.
- **Transparent Attribution**: Every benchmark run report details the SPDX identifiers (`spdxId`) of the host runtime and adapter used.

---

## 10. Failure Modes & Resilience Strategies

| Failure Mode                       | Root Cause                            | Impact                    | Automated Recovery Action                                            |
| :--------------------------------- | :------------------------------------ | :------------------------ | :------------------------------------------------------------------- |
| **Un-Isolated Extension**          | Provider injects proprietary env vars | Evaluator results skewed  | `ProviderModelAuditor` rejects registration immediately              |
| **Privacy Breach / Log Retention** | Cloud vendor stores prompt traces     | Data governance violation | Quarantines provider; failover to local OCI backend                  |
| **Cost Budget Exceeded**           | Agent enters infinite loop in cloud   | Cloud bill inflation      | `CostGovernor` automatically terminates instance at budget threshold |
| **Cold-Boot Latency Spike**        | Cloud provider resource contention    | Execution timeout         | Fallback routing switches to secondary pre-warmed provider           |
| **Airgap Network Leak**            | Misconfigured egress route            | Benchmark contamination   | Security boundary enforcer aborts run and flags breach               |

---

## 11. Testing Strategy

1. **Descriptor Compliance Unit Tests (`tests/unit/provider-model.test.ts`)**:
   - Auditing local open-source and commercial provider manifests.
   - Detecting missing licenses, invalid rates, un-isolated extensions, and privacy violations.
2. **Cost Attribution Precision Tests**:
   - Validating per-second rounding, minimum duration floors, and network egress billing.
3. **Provider Registry Operations**:
   - Testing registration, classification filtering, and dynamic removal.
4. **Contract Schema Conformance Tests (`tests/contracts/sandbox-contracts.test.ts`)**:
   - Validating Draft 2020-12 JSON Schema compliance for all provider ecosystem contracts.

---

## 12. Acceptance Criteria

- [x] Provider ecosystem descriptors support all 5 hosting categories without core modification.
- [x] Zero vendor runtime dependencies or proprietary SDKs are linked into SemantIQ Core.
- [x] Local open-source execution remains fully functional offline with zero cost.
- [x] Commercial cloud providers provide audited cost attribution and zero data retention confirmations.
- [x] Provider extensions are strictly isolated from canonical benchmark evaluation metrics.
- [x] All 140+ existing test files continue passing with zero regressions.

---

## 13. Risks & Open Questions

- **Risk**: Cloud providers modifying pricing structures dynamically mid-run.  
  _Mitigation_: Cost rates are snapshotted in `ProviderEcosystemDescriptor` at run inception and verified against the billed duration.
- **Open Question**: Standardization of GPU capability descriptors across AMD ROCm, NVIDIA CUDA, and Apple Metal for future multi-modal benchmarks.

---

## 14. Facts, Assumptions, and Recommendations

- **Facts**:
  - SemantIQ Core uses universal execution contracts (`EnvironmentSpec`, `ExecutionRequest`, `ExecutionResult`).
  - No copyleft or proprietary runtime code is bundled in SemantIQ Core packages.
- **Assumptions**:
  - Modern cloud sandbox platforms provide HTTP/REST or gRPC APIs with sub-second provisioning.
  - Ephemeral containers and microVMs provide complete memory and disk wiping upon process termination.
- **Recommendations**:
  - Maintain `LOCAL_OPEN_SOURCE` (Local Docker/OCI) as the default out-of-the-box routing target for all newly installed SemantIQ instances.
  - Require cryptographically certified attestation manifests for any third-party provider participating in public benchmark leaderboards.
