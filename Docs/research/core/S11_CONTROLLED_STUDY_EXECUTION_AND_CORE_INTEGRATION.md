# S-11 Controlled Study Execution and Core Integration

## Decision

S-11/01 adds the minimum canonical study spine required to bind one controlled, non-human,
synthetic conformance trace across S-02 through S-10. It adds one orchestration identity, exact
version bridges, one execution plan, one provider-neutral ingestion boundary, and a typed S-10
handoff. It does not add a registry, evidence system, execution manifest, scientific maturity
taxonomy, provider runner, or persistence system.

This implementation has authority `ORCHESTRATION_AND_INTEGRATION_ONLY`. Scientific authority is
`NONE`.

## Checkpoint findings addressed

CORE-CHECKPOINT-01 identified missing end-to-end orchestration, construct identity discontinuity,
parallel protocol/manifest systems, and generic string references. S-11/01 addresses the minimum
foundation for those findings. It deliberately defers gate sufficiency, real provider execution,
and governed Core mutation.

| Gap | S-11/01 status | Result |
| --- | --- | --- |
| CCP-01 end-to-end orchestration | PARTIALLY_ADDRESSED | Synthetic ingestion reaches S-03, S-04, S-09, and an S-10 handoff |
| CCP-04 construct/operationalization discontinuity | ADDRESSED_FOR_STUDY_SPINE | Exact S-10 versions and explicit S-02 construct compatibility are retained |
| CCP-05 parallel protocol/manifests | STRONGLY_PARTIALLY_ADDRESSED | S-09 is canonical; older protocols are classified and require explicit adaptation |
| CCP-11 generic references | PARTIALLY_ADDRESSED | Study bindings use a bounded discriminated identity union; S-09 strings are emitted only at its compatibility boundary |
| CCP-02 governed mutation | DEFERRED | The required later interface is recorded; no mutation method changes |
| CCP-03 caller-asserted science | DEFERRED | Handoff records presence with no gate status or sufficiency finding |
| CCP-06 real provider execution | FOUNDATION_ONLY | Plan and ingestion boundary exist; no provider is called |
| CCP-07 empirical calibration/validity | DEFERRED_TO_EMPIRICAL_WORK | No evidence is created |
| CCP-08 independent replication | DEFERRED | S-09 remains unchanged |
| CCP-09 human study governance | DEFERRED | Primary trace is non-human |
| CCP-10 robustness/anti-gaming | DEFERRED | No new laboratory or estimator |

## Discovery and reconciliation

The current Core modules form a typed dependency chain through S-06. S-07 through S-10 preserve
increasing amounts of lineage through explicit references, but no previous object binds exact
intake, construct, operationalization, benchmark, metric, evaluator, and study versions together.

The older `packages/evidence` `StudyProtocol` represents preregistration, analysis planning,
deviations, and partner-study policy. `HumanBenchmarkStudyProtocol` and
`HumanRatingStudyDefinition` are role-specific Human-as-Subject and Human-as-Judge contracts. None
is suitable as the non-human cross-Core orchestration identity, and merging them into one universal
protocol would erase meaningful role boundaries.

S-09 `ExecutionManifest` remains the canonical evidence and reproducibility manifest. The older
`StudyExecutionManifest` is compatible legacy input. Its fields require explicit mapping and cannot
be treated as S-09 evidence merely because a legacy fingerprint or adherence score exists.

`BenchmarkProducerEngine` and `BenchmarkContractAdapter` remain compatible legacy engineering
paths. Their fixed scores and legacy confidence fields are not routed into S-03, S-09, or S-10 by
S-11/01.

## Canonical study spine

The implemented spine is:

```text
ResearchIntakeIdentity
  -> ConstructRegistryBridge(ConstructIdentity -> S-02 constructId)
  -> OperationalizationCoreBinding(OperationalizationIdentity)
  -> ControlledStudyIdentity
  -> BenchmarkIdentity
  -> MetricIdentity
  -> EvaluatorIdentity
  -> ControlledExecutionPlan
  -> EvaluatorExecution + MetricResult
  -> S-09 ExecutionManifest
  -> S-09 EvidencePackage
  -> PromotionEvidenceHandoff(PRESENT_NOT_ASSESSED)
```

`ControlledStudyIdentity` contains only `studyId` and `studyVersion`. It is an orchestration
identity. It does not mean registered, preregistered, approved, published, empirically executed,
validated, or admitted to Core.

## Identity graph

`ControlledStudyDefinition` binds the exact identities and versions of:

- S-10 research intake;
- S-10 construct;
- S-10 operationalization;
- S-02 benchmark;
- S-03 metric;
- S-04 evaluator; and
- optionally, an existing S-05 reliability study.

It also retains the semantic digests of the actual intake, construct, and operationalization source
records. Its own digest uses `semantiq-canonical-json-v1` and SHA-256. Set-like evidence references,
limitations, artifact IDs, and expected evidence scopes are sorted and deduplicated before hashing.

## Construct bridge

S-02 construct identity is currently an unversioned `constructId`; S-10 construct identity contains
`constructId` and `constructVersion`. S-11/01 does not rewrite either subsystem.

`ConstructRegistryBridge` retains both identities and requires:

- the exact S-10 construct identity and version;
- the corresponding existing S-02 construct ID;
- relationship `EXPLICIT_VERSIONED_COMPATIBILITY`;
- at least one compatibility evidence reference; and
- the invariant `sameIdDoesNotImplySameVersion = true`.

A matching string is insufficient. A different S-10 construct version fails closed.

## Operationalization bridge

`OperationalizationCoreBinding` retains the exact operationalization, construct, benchmark, metric,
and evaluator identities. It is explicitly `NON_HUMAN`. Construction validates these identities
against the actual S-10 records and the current S-02/S-03/S-04 registries.

Unknown or stale benchmark, metric, evaluator, operationalization, or construct versions are
rejected. Existing string binding references inside S-10 operationalization remain visible as
legacy compatibility data but do not become the canonical S-11 binding.

## Protocol reconciliation

| Abstraction | Classification | S-11/01 treatment |
| --- | --- | --- |
| `ControlledStudyDefinition` | CANONICAL_CURRENT | Exact non-human Core integration |
| `packages/evidence` `StudyProtocol` | COMPATIBLE_LEGACY | Future explicit adapter; no automatic promotion |
| `HumanBenchmarkStudyProtocol` | CANONICAL_ROLE_SPECIFIC | Unchanged Human-as-Subject contract |
| `HumanRatingStudyDefinition` | CANONICAL_ROLE_SPECIFIC | Unchanged Human-as-Judge contract |

Human protocols remain separate from non-human execution policy.

## Execution-manifest reconciliation

No S-11 execution manifest exists. `ControlledExecutionPlan` contains intended conditions only.
Observed conditions enter only through execution ingestion and are written to the existing S-09
`ExecutionManifest`.

Legacy fields are classified as follows:

- study/protocol identity and preregistration fingerprint: `REQUIRED_TO_ADAPT`;
- environment/model/dataset/trace fingerprints and software version: `REQUIRED_TO_ADAPT` into S-09
  environment, source revision, artifacts, or observed conditions;
- missing-data report, negative controls, and analysis parameters: `REQUIRED_TO_ADAPT` as records or
  artifacts without inferred gate status;
- timestamps and evaluation references: `REDUNDANT` when exact S-09 records exist;
- partner attestation and adherence score: `LEGACY_ONLY`, never scientific or governance authority.

S-11/01 does not implement a lossy automatic converter. Unknown legacy fields therefore fail
closed until a later explicit adapter supplies the corresponding S-09 material.

## Typed reference strategy

`CanonicalStudyCoreReference` is a bounded discriminated union for intake, construct,
operationalization, benchmark, metric, evaluator, reliability study, and evidence package
identities. It is not a repository-wide ontology.

S-09 still requires string reference IDs. `ControlledStudyIntegration` creates those strings at one
compatibility boundary from already validated typed identities. New S-11 APIs do not accept an
arbitrary scope plus arbitrary reference string as a substitute for canonical identity.

## Controlled execution plan

`ControlledExecutionPlan` binds the exact study digest and benchmark, metric, and evaluator
versions. It records intended conditions, input and expected-output artifact IDs, environment
requirements, tool policy, seed policy, and expected evidence scopes.

S-11/01 fixes execution policy to `SYNTHETIC_INGESTION_ONLY`, tool policy to
`NO_EXTERNAL_TOOLS`, and model/provider requirement to `NONE`. Plan mutation or stale study digest
fails closed.

## Synthetic end-to-end trace

The focused fixture uses the first-party `provider_tck@0.1.0` engineering benchmark,
`provider_tck_passed_tests@0.1.0`, and `sandbox_tck_suite@0.1.0`. It creates an obviously synthetic
single observation and binds it through:

1. S-10 intake, construct, and operationalization;
2. the controlled study and execution plan;
3. S-03 metric aggregation;
4. S-04 evaluator execution validation;
5. S-09 environment and execution manifests;
6. the existing S-09 `EvidencePackage` and `EvidenceVerifier`; and
7. an S-10 evidence handoff with no asserted gate status.

The trace is marked `SYNTHETIC_NON_EMPIRICAL`, has scientific authority `NONE`, and uses no network,
provider SDK, model, Human record, third-party content, credential, or private source.

## Failure trace and missingness

The required end-to-end failure changes only the S-10 construct version while retaining the same
construct ID. Study construction rejects it as `CONSTRUCT_VERSION_MISMATCH`.

Additional focused checks reject stale metric/evaluator versions, a mutated plan digest, and a
missing planned artifact. Failed synthetic execution retains the S-04 failure record and creates an
explicit S-03 missing result with reason `EVALUATOR_FAILURE`. It does not create a zero score or a
successful evaluator output.

## S-09 integration

The integration runtime uses `EvidenceSystem.createEnvironmentManifest`,
`createExecutionManifest`, `createEvidencePackage`, and `EvidenceVerifier.verify`. Evidence records
retain exact study, intake, construct, operationalization, benchmark, metric, evaluator, execution,
and result versions/digests.

Verification authority remains `INTERNAL_CONSISTENCY_ONLY`; package and trace scientific authority
remain `NONE`.

## S-10 handoff

`PromotionEvidenceHandoff` identifies the exact gate, study, benchmark, evidence package, and record
references. Its only evidence state is `PRESENT_NOT_ASSESSED`; sufficiency is `NOT_PERFORMED` and
promotion gate status is `NOT_SET`.

Evidence presence does not set `SATISFIED`. S-11/01 does not call `assessPromotion`, record a Core
decision, or mutate S-02.

## Scientific boundaries

S-11/01 preserves:

- successful execution does not imply scientific validity;
- repeatable execution does not imply construct validity;
- verified evidence does not imply scientific truth;
- a synthetic trace does not imply empirical evidence;
- matching construct IDs do not imply matching versions;
- evidence presence does not imply sufficiency; and
- study completion does not imply Core eligibility.

No calibration, validity, reliability-in-practice, robustness, Human-AI comparability, reproduction,
replication, or scientific maturity claim is created.

## Governance boundaries

S-02 remains the sole registry and lifecycle mutation authority. S-09 remains internal-consistency
verification only. S-10 remains assessment-recommendation only. S-11 is orchestration and
integration only.

A later mutation bridge must require a valid exact S-10 assessment, explicit Human governance
decision, exact benchmark identity, exact assessment/decision lineage, and separate S-02 mutation
authorization. That bridge is not implemented here.

## Remaining S-11 work

The checkpoint decomposition remains appropriate with one refinement: legacy protocol adaptation
should be part of controlled execution rather than a separate evidence system.

1. **S-11/02 Controlled Execution Adapter** — execute or ingest a real provider-neutral run while
   preserving planned and observed conditions. No scientific claims.
2. **S-11/03 Typed Evidence Resolution and Promotion Gates** — derive bounded gate evidence states
   from exact canonical records without deciding scientific sufficiency automatically.
3. **S-11/04 Governed S-10 to S-02 Mutation Bridge** — enforce exact Human-governance lineage and a
   separately authorized registry mutation.
4. **S-11/05 End-to-End Core Conformance and Pilot Readiness** — validate one complete non-human
   path and decide whether a controlled empirical pilot can begin.

S-11/01 is an integration foundation, not completion of S-11 and not pilot authorization.

## S-11/02 controlled execution adapter

S-11/02 adds the missing provider-neutral boundary between a frozen `ControlledExecutionPlan` and
the S-11/01 ingestion path. It is an engineering execution adapter only. It does not add a provider
SDK, invoke a model, mutate a registry, assess scientific evidence, or admit a benchmark to Core.

The execution path remains layered:

```text
ControlledStudyDefinition + ControlledExecutionPlan
  -> ControlledExecutionRequest
  -> ControlledExecutionAdapter
  -> ControlledExecutionObservation
  -> separate S-04 evaluator bridge
  -> S-03 MetricResult
  -> S-09 EnvironmentManifest + ExecutionManifest + EvidencePackage
  -> S-10 handoff(PRESENT_NOT_ASSESSED / NOT_PERFORMED / NOT_SET)
```

### Discovery and reuse

| Existing abstraction | Classification | Existing purpose | Coupling and failure semantics | S-09 compatibility | S-11/02 decision |
| --- | --- | --- | --- | --- | --- |
| `ControlledStudyIntegration` | `CANONICAL_CURRENT` | Exact S-02/S-03/S-04/S-09 study spine | Provider/model neutral; fail-closed validation | Native | Extend only its ingestion inputs for observed output IDs and explicit missingness |
| `MetricRegistry` / `MetricResult` | `CANONICAL_CURRENT` | S-03 value, aggregation, and missingness semantics | No provider coupling | Native | Reuse unchanged |
| `EvaluatorRegistry` / `EvaluatorExecution` | `CANONICAL_CURRENT` | S-04 evaluator configuration and execution records | Optional model provenance; explicit failure/abstention | Native | Reuse unchanged after adapter execution |
| S-09 `EvidenceSystem` | `CANONICAL_CURRENT` | Environment, execution, artifact, package, and verification records | Provider-neutral; explicit unknown/unavailable states | Native | Reuse unchanged |
| `ISandboxProvider` / `ISandboxInstance` | `COMPATIBLE_CURRENT` | Provider-neutral sandbox lifecycle and command execution | Sandbox-provider coupled; runtime errors and termination | Adaptable | May sit behind a future adapter; not called here |
| `SemantiqProviderAdapter` | `ENGINEERING_ONLY` | Provider SDK for provision/command/destroy | Runtime-provider coupled; thrown errors | Partial | Keep behind the S-11 adapter boundary |
| `SandboxTCK` | `ENGINEERING_ONLY` | Provider contract conformance execution | Sandbox-provider coupled; per-check failures | Artifact input | Reuse only as a deterministic evaluator fixture |
| `CLIRunnerEngine` / `ExecutionAPIService` | `PARTIAL` | Local run lifecycle and execution routing | Local provider IDs, generated timestamps, mutable in-memory state | Partial | Do not treat as canonical study execution |
| `BenchmarkProducerEngine` | `COMPATIBLE_LEGACY` | Synthetic benchmark output generation | Fixed mock provider/model output | Legacy bridge only | No automatic S-09 promotion |
| `BenchmarkContractAdapter` | `COMPATIBLE_LEGACY` | Legacy product `Run`/`Trace`/`Evaluation` adaptation | Copies legacy provider metadata; synthetic timing/token values | Not native | Do not reuse for canonical S-11 evidence |
| `StudyExecutionManifest` | `COMPATIBLE_LEGACY` | Protocol-adherence and partner-study record | Model/environment fingerprints; adherence result | Loss-aware mapping required | `LEGACY_EXECUTION_ADAPTER = DEFERRED` |
| SDK run/profile contracts | `PARTIAL` | Client and comparative research profiles | Product/API oriented | Referential | Preserve outside the canonical adapter contract |

No existing abstraction validates the exact controlled study and plan before execution while also
separating intended conditions from observed conditions. The new adapter fills only that gap.

### Request and identity binding

`ControlledExecutionRequest` contains the controlled study and plan, required input artifact
references, an optional timeout, engineering authority, and a semantic request digest. The digest
binds the exact study identity/digest, plan identity/digest, benchmark, metric, evaluator, artifacts,
intended conditions, environment requirement, tool policy, seed policy, and execution policy.

The coordinator validates these bindings and registry membership before calling an adapter. A
mutated request, stale plan digest, stale identity version, or missing input artifact fails closed.
Adapter identity is not a new canonical identity; observed provider information uses an evidence
value and existing provider/model provenance vocabulary.

### Observation and provider provenance

`ControlledExecutionObservation` records the actual run and execution references, status, provider
observation, independently recorded conditions, canonical S-09 environment input, artifact
references, explicit attempts, timing/resource evidence values, failure, limitations, and a semantic
observation digest. Raw provider output is not embedded in the record. Outputs, logs, traces, and
configuration remain S-09 `ArtifactReference` values with digests, rights, availability, and
redaction metadata.

Provider version and model snapshot may be `UNKNOWN` or `UNAVAILABLE`. A provider-managed alias is
not upgraded to an immutable snapshot, and a synthetic deterministic adapter does not establish
replayability for a real provider.

### Intended and observed conditions

The adapter must return a distinct observed-conditions record. Reusing the plan's intended object is
rejected. The coordinator compares configuration, language, tool policy, model, sampling, and
randomization values and separately compares the observed environment identity with the plan's
requirement.

Known unequal observations produce `DEVIATES`; unavailable observations produce `UNKNOWN` when no
known deviation exists. A mismatch remains evidence. The coordinator does not normalize it into the
planned value and does not assign scientific meaning. The focused fixture demonstrates that planned
`NO_EXTERNAL_TOOLS` and observed `EXTERNAL_TOOL_AVAILABLE` remain different in the S-09 manifest.

### Failure, missingness, timing, and retries

The bounded adapter failure vocabulary is `REQUEST_INVALID`, `PLAN_MISMATCH`, `ARTIFACT_MISSING`,
`ADAPTER_FAILURE`, `EXECUTION_FAILURE`, `TIMEOUT`, `OUTPUT_INVALID`, `EVALUATOR_FAILURE`,
`ENVIRONMENT_MISMATCH`, and `UNSUPPORTED_OPERATION`. Adapter exceptions fail closed. Returned
failures remain observable and skip evaluation.

Adapter/input failures map to S-03 `INVALID_INPUT` or `NOT_OBSERVED`; evaluator failures retain
`EVALUATOR_FAILURE`. No failure, timeout, missing output, abstention, partial result, or unknown state
becomes numeric zero. S-04 evaluation is a separate callback and remains the only path from a valid
execution output to an S-03 observation.

Timing, token usage, and numeric resource usage are evidence values. Unknown values remain unknown.
Attempts are ordered explicitly; a successful retry retains preceding failures. The coordinator does
not implement retry policy or a cost/accounting framework.

### Deterministic synthetic trace

The focused S-11/02 fixture is first-party, synthetic, non-human, offline, and non-empirical. Its
adapter returns one artifact reference and one observed condition set. A separate deterministic
evaluator emits one S-03 observation, after which the existing S-11/01 path creates the S-04 record,
S-09 manifests/package, internal-consistency result, and bounded S-10 handoff.

The fixture performs no network call, external inference, credential resolution, provider billing,
Human data collection, HIB/HACS execution, or scientific assessment.

### Authority and remaining work

S-11/02 authority is `CONTROLLED_EXECUTION_ADAPTER_ONLY`; scientific authority is `NONE`. Execution
success does not imply scientific validity. Adapter determinism does not imply empirical
reliability. Provider identity does not imply reproducible provider state. Observed output does not
imply a valid metric. Metric output does not establish construct validity. S-09 verification does
not establish scientific truth. Evidence presence does not satisfy S-10, and run completion does not
permit S-02 Core admission.

CCP-06 is addressed at the provider-neutral adapter layer, not at a live-provider or empirical
validation layer. CCP-01 is more strongly partially addressed. CCP-02 and CCP-03 remain deferred.
The remaining decomposition still holds:

1. **S-11/03 Typed Evidence Resolution and Promotion Gates** — add typed, bounded resolution without
   automatic sufficiency decisions.
2. **S-11/04 Governed S-10 to S-02 Mutation Bridge** — require exact assessment, Human decision,
   lineage, and separate mutation authorization.
3. **S-11/05 End-to-End Core Conformance and Pilot Readiness** — evaluate complete engineering
   conformance before any separately authorized pilot.
