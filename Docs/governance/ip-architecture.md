# Prospective IP architecture

**Status:** Proposed architecture for future development; not a legal ownership or license determination.

## Purpose and classes

SemantIQ separates future work by disclosure intent before implementation:

- **PUBLIC** — ecosystem-facing SDKs, API and schema contracts, connectors, safe examples, reproducibility formats, benchmark protocols, conformance tools, and interoperability documentation.
- **RESEARCH_PREPUBLICATION** — the default for new strategic R&D, including experimental evaluation methods, scoring concepts, benchmarks, safety mechanisms, representations, and anti-gaming research, until a publication decision is recorded.
- **PROTECTED** — intentionally non-public implementations or assets retained for strategic use. Protected implementation must never be placed in this public repository, including under a misleading `private` or `protected` directory.

`HOSTED_ENTERPRISE` and `BRAND_CERTIFICATION` are commercial and brand overlays, not code-license classes. Code licenses, trademark rights, and certification authority are distinct.

Repository presence does not establish ownership. Existing historical rights questions D-01 through D-08 remain on a separate review track.

## Dependency law

PUBLIC must build, test, and operate without research or protected source and without private-repository access.

- Allowed: `RESEARCH_PREPUBLICATION -> PUBLIC`, `PROTECTED -> PUBLIC`, `HOSTED_ENTERPRISE -> PUBLIC`.
- Forbidden: `PUBLIC -> PROTECTED`, `PUBLIC -> RESEARCH_PREPUBLICATION`.
- A protected system may implement a stable public contract; public code may not import its implementation.

## Repository topology

| Location | Visibility | Content | Dependency and release boundary |
|---|---|---|---|
| Semantiq | Public | PUBLIC only | Independently built, tested, released, and contributed to |
| Controlled research workspace | Restricted | RESEARCH_PREPUBLICATION | May depend on PUBLIC; no automatic publication |
| Protected implementation repository | Private | PROTECTED | May implement PUBLIC contracts; restricted CI, secrets, and releases |
| Enterprise/service repository | Private as needed | HOSTED_ENTERPRISE | Consumes PUBLIC contracts; managed operational release policy |
| Brand/certification governance | Controlled | BRAND_CERTIFICATION | Policy and signed-result governance, separated from code licensing |

No new remote repository is created by this decision. Cross-boundary exchange should use versioned schemas, APIs/RPC, package interfaces, artifact formats, capability manifests, provider interfaces, and signed evidence packages—not private source imports.

## Future-IP intake

Before substantial implementation, record whether the work is required for interoperability or reproducibility; benefits ecosystem adoption; exposes strategic intelligence or unpublished research; includes proprietary benchmark material; enables protected differentiation; has clear provenance and rights; depends on third-party restrictions; and has explicit publication approval.

Outcomes are `PUBLIC`, `RESEARCH_PREPUBLICATION`, `PROTECTED`, or `HOLD_RIGHTS_REVIEW`. New strategic R&D defaults to `RESEARCH_PREPUBLICATION`.

## Publication gate

Promotion from RESEARCH_PREPUBLICATION to PUBLIC requires: provenance clearance, accepted rights disposition, security and IP-value review, license compatibility, third-party review, secret scanning, explicit publication approval, tests, and documentation. Technical completion alone does not publish research.

Promotion to PROTECTED records strategic rationale, dependency boundaries, any public interface, provenance, third-party restrictions, internal versioning, security, and access requirements. Classification is not an ownership claim.

## SemantIQ Cyber boundary

| Layer | Public contract candidates | Research/protected implementation |
|---|---|---|
| Cyber Intelligence Evaluation | benchmark protocol, task/environment interface, scoring schema, trajectory/evidence format, reproducibility contract, safe fixtures | capability inference, exploit/patch intelligence, adaptive evaluation, advanced scoring, proprietary benchmark assets |
| Agent Safety & Containment | containment interfaces, event/evidence schemas, boundary and conformance contracts | advanced containment, drift and self-restraint intelligence, recovery intelligence, containment-gap analysis |
| Computational Software Intelligence | representation and serialization contracts, reproducibility package format, interoperability interfaces | Computational Representation generation, Execution Graph/Runtime IR, isolated execution intelligence, path/state/risk analysis, automated repair and reconstruction |

This record defines boundaries only; it adds none of those strategic implementations.

## Decision matrix

| Area | Class | Public interface? | Implementation location | Decision |
|---|---|---:|---|---|
| SDK, API contracts, schemas | PUBLIC | Yes | Semantiq | Keep independently usable |
| Reproducibility and conformance | PUBLIC | Yes | Semantiq | Open formats and deterministic verification |
| Benchmark protocol | PUBLIC | Yes | Semantiq | Protocol may be public |
| Benchmark assets | RESEARCH_PREPUBLICATION or PROTECTED | Selective | Controlled workspace | Publish only safe, cleared fixtures |
| Basic scoring contracts | PUBLIC | Yes | Semantiq | Contract, not strategic intelligence |
| Advanced scoring and anti-gaming | RESEARCH_PREPUBLICATION or PROTECTED | Contract only | Restricted repository | No public implementation by default |
| Cyber benchmark protocol | PUBLIC | Yes | Semantiq | Future contract bootstrap |
| Cyber intelligence | PROTECTED | Selective | Protected repository | No implementation here |
| Containment contracts | PUBLIC | Yes | Semantiq | Interfaces and evidence schemas only |
| Advanced containment | PROTECTED | Contract only | Protected repository | No implementation here |
| Computational Representation contract | PUBLIC if safe | Yes | Semantiq | Versioned interface |
| Computational Representation implementation | RESEARCH_PREPUBLICATION or PROTECTED | No | Restricted repository | Strategic implementation |
| Execution Graph/Runtime IR | RESEARCH_PREPUBLICATION or PROTECTED | Selective | Restricted repository | Strategic implementation |
| Path/state/risk intelligence and automated repair | PROTECTED | Selective | Protected repository | Strategic implementation |
| Hosted backend and enterprise governance | HOSTED_ENTERPRISE | Public contracts | Service repository | Commercial overlay |
| Certification system | BRAND_CERTIFICATION | Published criteria | Controlled governance | Does not follow from open-source use |
| Brand/trademark | BRAND_CERTIFICATION | Usage policy | Controlled governance | No registration claim |

## Contribution, licensing, and brand decisions

The future contribution model must capture identity, provenance, rights representations, third-party material, appropriate AI-assistance disclosure, patent considerations, and scope. DCO, CLA, or DCO plus a targeted CLA remain **HUMAN/LEGAL DECISION REQUIRED**.

No license changes are authorized. MIT, Apache-2.0, MPL-2.0, AGPL, and source-available/commercial roles remain candidates for later analysis; `APACHE_2_SELECTION = NOT_AUTHORIZED`, and existing MIT rights are not revocable by this architecture.

Future use of “SemantIQ Verified”, “SemantIQ Certified”, official benchmark results, or official implementations requires separate trademark-usage, criteria, verification, correction/revocation, and version-specific policies. Open-source implementation does not confer certification authority, and no trademark registration is claimed.

## Roadmap

1. **A-02:** bootstrap repository topology and research/protected workspace boundaries without publishing protected source.
2. **A-03/A-04:** prepare the contribution/provenance and license/open-core human decisions together where evidence overlaps.
3. **A-05/A-06:** decide benchmark/data rights and brand/certification policy.
4. **A-07:** bootstrap SemantIQ Cyber public contracts and restricted-development boundary.
5. **A-08/A-09:** define Computational Software Intelligence and hosted cross-repository interfaces.
6. **A-10:** verify boundaries, threats, release flows, and governance seal.

Each gate follows `DECIDE -> IMPLEMENT SAFE PART -> TEST -> RECORD`.
