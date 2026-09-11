# Controlled research-start governance

**Status:** Prospective operational governance, not a legal ownership, copyrightability, license, or trademark determination.

## Decision model

An unresolved matter blocks controlled research only when a specific planned activity cannot safely proceed without the affected input, right, access, or security condition.

| Route | Operational effect |
|---|---|
| `BLOCKS_CONTROLLED_RESEARCH_START` | A required feature-specific input, permission, provenance fact, or safe boundary is absent |
| `BLOCKS_PUBLICATION_OR_PROMOTION` | Research may proceed, but public/protected promotion awaits the existing gate |
| `BLOCKS_RELICENSING_OR_EXTERNAL_CONTRIBUTION` | A future license change or substantial external input needs human/legal policy |
| `BLOCKS_BRAND_OR_CERTIFICATION` | Official status, criteria, or authority is unresolved |
| `NON_BLOCKING_FOR_CURRENT_RESEARCH` | The question is unrelated to the controlled bootstrap inputs |

The safe `CYBER-BOOTSTRAP-001` plan uses project-existing source and synthetic fixtures. No required uncleared third-party dataset, private service, or external code is identified. Its research-start blocker count is therefore zero. New evidence can change that decision and must be recorded through intake review.

## Prospective provenance and AI assistance

Record facts using `HUMAN_DIRECTION`, `AI_ASSISTED`, `AI_GENERATED`, `THIRD_PARTY_SOURCE`, `PROJECT_EXISTING_SOURCE`, or `MIXED`. Where known and practical, record tool/provider, model, date/session reference, human direction and architecture decisions, human selection/modification/review, external inputs, generated implementation role, and verification.

This model neither claims nor denies ownership or copyrightability. It does not require impossible reconstruction of historical sessions. Current research records facts prospectively and uses safe reference identifiers when detail is restricted.

## Third-party input routing

- `FIRST_PARTY_OR_PROJECT` and `OPEN_CLEARED`: normally eligible for controlled research.
- `PUBLIC_REFERENCE_ONLY`: may inform research; availability does not authorize copying or redistribution.
- `RESTRICTED_REVIEW_REQUIRED` and `UNKNOWN_RIGHTS`: required material routes to `HOLD_RIGHTS_REVIEW` before use, implementation, redistribution, or benchmark publication.
- `PROHIBITED`: must not enter the research workspace.

No public record may contain secrets, credentials, private repository locations, private implementation details, sensitive exploit instructions, or unnecessary personal information.

## Cyber sensitivity

- `CYBER_SAFE`: schemas, interfaces, synthetic safe fixtures, reproducibility contracts, and defensive conformance tests.
- `CYBER_CONTROLLED`: capability evaluation, agent trajectories, containment experiments, adaptive evaluation, and non-public vulnerability reasoning.
- `CYBER_HIGH_SENSITIVITY`: reusable offensive intelligence, target-specific information, or protected attack/repair intelligence.

Strategic Cyber implementation defaults to `RESEARCH_PREPUBLICATION`. Passing tests never makes high-sensitivity work PUBLIC.

## Contribution minimum

External contributions cannot silently enter restricted research. Substantial external material requires recorded contributor identity/provenance, declared third-party material, and material AI-assistance disclosure. Acceptance into research does not authorize publication. The final DCO, CLA, or targeted-CLA model remains `HUMAN/LEGAL DECISION REQUIRED`; this does not block controlled internal research.

## License and open-core minimum

`CURRENT_PUBLIC_LICENSE_CHANGE = NOT_AUTHORIZED` and `RESEARCH_START_REQUIRES_RELICENSING = NO`. Adjacent development does not convert RESEARCH_PREPUBLICATION into PUBLIC. PROTECTED implementation stays outside the public repository. Public promotion requires explicit rights and license review. Existing legitimately distributed MIT material retains its historical rights.

## Publication is a separate transition

`IMPLEMENTED != PUBLIC`, `TESTED != PUBLIC`, `RESEARCH_COMPLETE != PUBLIC`, and `PUBLICATION_REQUESTED != PUBLICATION_APPROVED`. Research-to-public uses the A-01/A-02 publication gate; research-to-protected requires a recorded promotion. Directory moves and package publication cannot silently change classification.

## Cyber bootstrap boundary

The next controlled gate may begin C-01, the Cyber Agent Behavioral Benchmark Bootstrap, in an appropriate restricted RESEARCH_PREPUBLICATION environment. It may research behavioral tasks, agent/environment interaction, permission/budget models, trajectories, evidence capture, initial behavioral scoring, containment events, and reproducibility.

Only separately reviewed safe contracts, schemas, fixtures, or conformance material may later enter public SemantIQ. This authorization excludes real-world exploitation, target-specific intrusion, credential acquisition, malware deployment, public exploit-intelligence release, protected-algorithm publication, and proprietary benchmark publication.

## Rights-track routing

D-01 through D-08 remain `UNRESOLVED_CARRIED_FORWARD`. Each blocks a feature only when that feature depends on it; relevant items may also block publication, relicensing, external contributions, or certification. None is deemed resolved by this governance record.
