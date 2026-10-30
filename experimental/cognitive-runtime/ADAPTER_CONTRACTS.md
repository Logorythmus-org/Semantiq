# Candidate adapters (interface notes; NOT implementations)

**LogicNet adapter**: accept an immutable typed `claims[]` graph and a declared class of reasoning rules; return rule IDs, proofs or counterexamples *only if independently computed*, not a model-authored "proof". Expose capability discovery and deterministic test vectors, and do not embed private logic implementations in the MIT package without an IP decision.

**Atlas of Questions adapter**: transform explicit unresolved or contradiction groups into candidate follow-up questions, retaining claim IDs, evidence gaps and source time. Must never promote generated questions to observed facts.

**Wylo adapter**: optionally consume verified scenario facts and constraints, generate alternative actions including HOLD / NO ACTION, identify responsible decision maker and reversible/irreversible effects, and require separate human authorization before execution. Should not infer moral authority from numerical utility.

**Semantic World / Digital Twin adapter**: map subject IDs to versioned world-state entities/events and deterministic state transitions. Run simulations only inside an isolated environment, keep the simulated/observed tags apart, and validate against external system data before claiming fidelity.

**MRP presentation adapter**: format supported, contradicted, unresolved and unauthenticated items into both visual and voice-accessible outputs. Never hide counterevidence or an explicit refusal to act.

Every adapter is an independent future work package. **None** of these modules is included as a working engine in Phase 6.
