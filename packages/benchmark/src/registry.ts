import { canonicalJson, computeSha256 } from "../../sandbox-contracts/src/index.js";
import {
  BENCHMARK_EVALUATOR_MECHANISMS,
  BENCHMARK_HUMAN_ROLES,
  BENCHMARK_IMPLEMENTATION_STATES,
  BENCHMARK_LIFECYCLE_STATES,
  BENCHMARK_SCIENTIFIC_MATURITY,
  type BenchmarkIdentity,
  type BenchmarkLifecycleState,
  type BenchmarkMaturityLevel,
  type BenchmarkRegistryValidationResult,
  type BenchmarkRegistryViolation,
  type BenchmarkScientificMaturity,
  type CanonicalBenchmarkDefinition,
  type CanonicalBenchmarkRegistrySnapshot
} from "./registry-types.js";

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

const lifecycleTransitions: Readonly<
  Record<BenchmarkLifecycleState, readonly BenchmarkLifecycleState[]>
> = {
  DRAFT: ["ACTIVE"],
  ACTIVE: ["DEPRECATED"],
  DEPRECATED: ["RETIRED"],
  RETIRED: []
};

const scientificTransitions: Readonly<
  Record<BenchmarkScientificMaturity, readonly BenchmarkScientificMaturity[]>
> = {
  NOT_ESTABLISHED: ["SYNTHETIC_ONLY", "UNVALIDATED_PROXY", "CALIBRATION_REQUIRED"],
  SYNTHETIC_ONLY: ["UNVALIDATED_PROXY", "CALIBRATION_REQUIRED"],
  UNVALIDATED_PROXY: ["CALIBRATION_REQUIRED"],
  CALIBRATION_REQUIRED: ["CALIBRATED"],
  CALIBRATED: ["VALIDATED"],
  VALIDATED: []
};

export function benchmarkIdentityKey(identity: BenchmarkIdentity): string {
  return `${identity.benchmarkId}@${identity.benchmarkVersion}`;
}

function pushViolation(
  violations: BenchmarkRegistryViolation[],
  code: string,
  path: string,
  message: string
): void {
  violations.push({ code, path, message });
}

function hasDuplicates(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}

function validateReferences(
  snapshot: CanonicalBenchmarkRegistrySnapshot,
  violations: BenchmarkRegistryViolation[]
): void {
  const families = new Set(snapshot.families.map((family) => family.familyId));
  const constructs = new Set(snapshot.constructs.map((construct) => construct.constructId));
  const identities = new Set(
    snapshot.benchmarks.map((benchmark) => benchmarkIdentityKey(benchmark.identity))
  );

  snapshot.benchmarks.forEach((benchmark, index) => {
    const path = `benchmarks[${index}]`;
    const ownKey = benchmarkIdentityKey(benchmark.identity);
    if (!families.has(benchmark.familyId)) {
      pushViolation(
        violations,
        "UNKNOWN_FAMILY",
        `${path}.familyId`,
        `Unknown family '${benchmark.familyId}'.`
      );
    }
    for (const constructId of benchmark.constructIds) {
      if (!constructs.has(constructId)) {
        pushViolation(
          violations,
          "UNKNOWN_CONSTRUCT",
          `${path}.constructIds`,
          `Unknown construct '${constructId}'.`
        );
      }
    }
    for (const superseded of benchmark.supersedes) {
      const targetKey = benchmarkIdentityKey(superseded);
      if (targetKey === ownKey) {
        pushViolation(
          violations,
          "SELF_SUPERSESSION",
          `${path}.supersedes`,
          `${ownKey} cannot supersede itself.`
        );
      } else if (!identities.has(targetKey)) {
        pushViolation(
          violations,
          "BROKEN_SUPERSESSION",
          `${path}.supersedes`,
          `Unknown superseded identity '${targetKey}'.`
        );
      }
    }
    if (benchmark.provenance.supersededBy) {
      const targetKey = benchmarkIdentityKey(benchmark.provenance.supersededBy);
      if (targetKey === ownKey) {
        pushViolation(
          violations,
          "SELF_SUPERSESSION",
          `${path}.provenance.supersededBy`,
          `${ownKey} cannot supersede itself.`
        );
      } else if (!identities.has(targetKey)) {
        pushViolation(
          violations,
          "BROKEN_SUPERSESSION",
          `${path}.provenance.supersededBy`,
          `Unknown successor '${targetKey}'.`
        );
      }
    }
  });
}

function validateSupersessionCycles(
  snapshot: CanonicalBenchmarkRegistrySnapshot,
  violations: BenchmarkRegistryViolation[]
): void {
  const graph = new Map<string, readonly string[]>();
  for (const benchmark of snapshot.benchmarks) {
    graph.set(
      benchmarkIdentityKey(benchmark.identity),
      benchmark.supersedes.map(benchmarkIdentityKey)
    );
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (key: string): void => {
    if (visiting.has(key)) {
      pushViolation(
        violations,
        "SUPERSESSION_CYCLE",
        "benchmarks",
        `Supersession cycle includes '${key}'.`
      );
      return;
    }
    if (visited.has(key)) return;
    visiting.add(key);
    for (const target of graph.get(key) ?? []) visit(target);
    visiting.delete(key);
    visited.add(key);
  };
  for (const key of graph.keys()) visit(key);
}

function validateAliases(
  snapshot: CanonicalBenchmarkRegistrySnapshot,
  violations: BenchmarkRegistryViolation[]
): void {
  const aliases = new Map<
    string,
    { identity: BenchmarkIdentity; alias: CanonicalBenchmarkDefinition["aliases"][number] }[]
  >();
  snapshot.benchmarks.forEach((benchmark) => {
    for (const alias of benchmark.aliases) {
      const normalized = alias.value.trim().toLowerCase();
      const declarations = aliases.get(normalized) ?? [];
      declarations.push({ identity: benchmark.identity, alias });
      aliases.set(normalized, declarations);
    }
  });
  for (const [aliasValue, declarations] of aliases) {
    if (declarations.length < 2) continue;
    const identityKeys = declarations.map(({ identity }) => benchmarkIdentityKey(identity));
    for (const declaration of declarations) {
      const ownKey = benchmarkIdentityKey(declaration.identity);
      const collisionKeys = new Set(declaration.alias.collidesWith.map(benchmarkIdentityKey));
      const missing = identityKeys.filter((key) => key !== ownKey && !collisionKeys.has(key));
      if (declaration.alias.kind !== "HISTORICAL_NAME_COLLISION" || missing.length > 0) {
        pushViolation(
          violations,
          "SILENT_ALIAS_COLLISION",
          `alias:${aliasValue}`,
          `Alias '${aliasValue}' collides across ${identityKeys.join(", ")} without reciprocal collision metadata.`
        );
      }
    }
  }
}

function validateEvidence(
  benchmark: CanonicalBenchmarkDefinition,
  index: number,
  violations: BenchmarkRegistryViolation[]
): void {
  const path = `benchmarks[${index}]`;
  if (
    (benchmark.implementationState === "EXECUTABLE" ||
      benchmark.implementationState === "REPRODUCIBLE") &&
    benchmark.evidence.implementation.length === 0
  ) {
    pushViolation(
      violations,
      "MISSING_IMPLEMENTATION_EVIDENCE",
      `${path}.evidence.implementation`,
      "Executable states require implementation evidence."
    );
  }
  if (
    benchmark.implementationState === "REPRODUCIBLE" &&
    benchmark.evidence.reproducibility.length === 0
  ) {
    pushViolation(
      violations,
      "MISSING_REPRODUCIBILITY_EVIDENCE",
      `${path}.evidence.reproducibility`,
      "REPRODUCIBLE requires reproducibility evidence."
    );
  }
  if (
    (benchmark.scientificMaturity === "CALIBRATED" ||
      benchmark.scientificMaturity === "VALIDATED") &&
    (benchmark.implementationState !== "REPRODUCIBLE" ||
      benchmark.evidence.reproducibility.length === 0)
  ) {
    pushViolation(
      violations,
      "SCIENTIFIC_MATURITY_REQUIRES_REPRODUCIBILITY",
      `${path}.scientificMaturity`,
      "CALIBRATED and VALIDATED require a reproducible implementation and reproducibility evidence."
    );
  }
  if (
    (benchmark.scientificMaturity === "CALIBRATED" ||
      benchmark.scientificMaturity === "VALIDATED") &&
    benchmark.evidence.calibration.length === 0
  ) {
    pushViolation(
      violations,
      "MISSING_CALIBRATION_EVIDENCE",
      `${path}.evidence.calibration`,
      "CALIBRATED and VALIDATED require calibration evidence."
    );
  }
  if (benchmark.scientificMaturity === "VALIDATED" && benchmark.evidence.validation.length === 0) {
    pushViolation(
      violations,
      "MISSING_VALIDATION_EVIDENCE",
      `${path}.evidence.validation`,
      "VALIDATED requires explicit validation evidence."
    );
  }
  if (benchmark.corePromotion === "PROMOTED") {
    if (benchmark.scientificMaturity !== "VALIDATED") {
      pushViolation(
        violations,
        "CORE_REQUIRES_VALIDATION",
        `${path}.corePromotion`,
        "Core promotion requires VALIDATED scientific maturity."
      );
    }
    if (benchmark.evidence.promotion.length === 0) {
      pushViolation(
        violations,
        "MISSING_PROMOTION_EVIDENCE",
        `${path}.evidence.promotion`,
        "Core promotion requires explicit promotion evidence."
      );
    }
  }
  benchmark.evaluatorRequirements.forEach((requirement, requirementIndex) => {
    if (requirement.bindingStatus === "IMPLEMENTED_AND_BOUND") {
      if (!requirement.evaluatorId || requirement.evidenceReferences.length === 0) {
        pushViolation(
          violations,
          "INVALID_EVALUATOR_BINDING",
          `${path}.evaluatorRequirements[${requirementIndex}]`,
          "IMPLEMENTED_AND_BOUND requires an evaluator ID and evidence reference."
        );
      }
    }
  });
  benchmark.humanRoles.forEach((declaration, roleIndex) => {
    if (declaration.status === "IMPLEMENTED" && declaration.evidenceReferences.length === 0) {
      pushViolation(
        violations,
        "INVALID_HUMAN_ROLE_BINDING",
        `${path}.humanRoles[${roleIndex}]`,
        "Implemented human roles require evidence."
      );
    }
  });
}

export function validateBenchmarkRegistry(
  snapshot: CanonicalBenchmarkRegistrySnapshot
): BenchmarkRegistryValidationResult {
  const violations: BenchmarkRegistryViolation[] = [];
  if (!SEMVER_PATTERN.test(snapshot.registrySchemaVersion)) {
    pushViolation(
      violations,
      "INVALID_REGISTRY_SCHEMA_VERSION",
      "registrySchemaVersion",
      "Registry schema version must be SemVer."
    );
  }
  const familyIds = snapshot.families.map((family) => family.familyId);
  const constructIds = snapshot.constructs.map((construct) => construct.constructId);
  const identityKeys = snapshot.benchmarks.map((benchmark) =>
    benchmarkIdentityKey(benchmark.identity)
  );
  if (hasDuplicates(familyIds))
    pushViolation(violations, "DUPLICATE_FAMILY_ID", "families", "Family IDs must be unique.");
  if (hasDuplicates(constructIds))
    pushViolation(
      violations,
      "DUPLICATE_CONSTRUCT_ID",
      "constructs",
      "Construct IDs must be unique."
    );
  if (hasDuplicates(identityKeys))
    pushViolation(
      violations,
      "DUPLICATE_BENCHMARK_IDENTITY",
      "benchmarks",
      "Benchmark ID and version pairs must be unique."
    );

  snapshot.benchmarks.forEach((benchmark, index) => {
    const path = `benchmarks[${index}]`;
    if (!benchmark.identity.benchmarkId.trim()) {
      pushViolation(
        violations,
        "INVALID_BENCHMARK_ID",
        `${path}.identity.benchmarkId`,
        "Benchmark ID cannot be empty."
      );
    }
    if (!SEMVER_PATTERN.test(benchmark.identity.benchmarkVersion)) {
      pushViolation(
        violations,
        "INVALID_BENCHMARK_VERSION",
        `${path}.identity.benchmarkVersion`,
        `Invalid benchmark version '${benchmark.identity.benchmarkVersion}'.`
      );
    }
    if (benchmark.versionScope !== "BENCHMARK") {
      pushViolation(
        violations,
        "INVALID_VERSION_SCOPE",
        `${path}.versionScope`,
        "Version scope must remain BENCHMARK."
      );
    }
    if (!BENCHMARK_IMPLEMENTATION_STATES.includes(benchmark.implementationState)) {
      pushViolation(
        violations,
        "INVALID_IMPLEMENTATION_STATE",
        `${path}.implementationState`,
        "Unknown implementation state."
      );
    }
    if (!BENCHMARK_SCIENTIFIC_MATURITY.includes(benchmark.scientificMaturity)) {
      pushViolation(
        violations,
        "INVALID_SCIENTIFIC_MATURITY",
        `${path}.scientificMaturity`,
        "Unknown scientific maturity."
      );
    }
    if (!BENCHMARK_LIFECYCLE_STATES.includes(benchmark.lifecycleState)) {
      pushViolation(
        violations,
        "INVALID_LIFECYCLE_STATE",
        `${path}.lifecycleState`,
        "Unknown lifecycle state."
      );
    }
    for (const requirement of benchmark.evaluatorRequirements) {
      if (!BENCHMARK_EVALUATOR_MECHANISMS.includes(requirement.mechanism)) {
        pushViolation(
          violations,
          "UNSUPPORTED_EVALUATOR",
          `${path}.evaluatorRequirements`,
          `Unsupported evaluator mechanism '${requirement.mechanism}'.`
        );
      }
    }
    for (const declaration of benchmark.humanRoles) {
      if (!BENCHMARK_HUMAN_ROLES.includes(declaration.role)) {
        pushViolation(
          violations,
          "UNSUPPORTED_HUMAN_ROLE",
          `${path}.humanRoles`,
          `Unsupported human role '${declaration.role}'.`
        );
      }
    }
    validateEvidence(benchmark, index, violations);
  });
  validateReferences(snapshot, violations);
  validateAliases(snapshot, violations);
  validateSupersessionCycles(snapshot, violations);
  return { valid: violations.length === 0, violations };
}

export class BenchmarkRegistryValidationError extends Error {
  constructor(readonly violations: readonly BenchmarkRegistryViolation[]) {
    super(violations.map((violation) => `${violation.code}: ${violation.message}`).join("\n"));
    this.name = "BenchmarkRegistryValidationError";
  }
}

export class BenchmarkRegistry {
  private readonly entries: ReadonlyMap<string, CanonicalBenchmarkDefinition>;

  constructor(readonly snapshot: CanonicalBenchmarkRegistrySnapshot) {
    const result = validateBenchmarkRegistry(snapshot);
    if (!result.valid) throw new BenchmarkRegistryValidationError(result.violations);
    this.entries = new Map(
      snapshot.benchmarks.map((benchmark) => [benchmarkIdentityKey(benchmark.identity), benchmark])
    );
  }

  get(identity: BenchmarkIdentity): CanonicalBenchmarkDefinition | undefined {
    return this.entries.get(benchmarkIdentityKey(identity));
  }

  list(): readonly CanonicalBenchmarkDefinition[] {
    return [...this.entries.values()].sort((a, b) =>
      benchmarkIdentityKey(a.identity).localeCompare(benchmarkIdentityKey(b.identity))
    );
  }

  resolveAlias(alias: string): readonly CanonicalBenchmarkDefinition[] {
    const normalized = alias.trim().toLowerCase();
    return this.list().filter((benchmark) =>
      benchmark.aliases.some((candidate) => candidate.value.trim().toLowerCase() === normalized)
    );
  }

  deriveMaturity(identity: BenchmarkIdentity): BenchmarkMaturityLevel {
    const benchmark = this.requireEntry(identity);
    if (benchmark.corePromotion === "PROMOTED") return "M6";
    if (benchmark.scientificMaturity === "VALIDATED") return "M5";
    if (benchmark.scientificMaturity === "CALIBRATED") return "M4";
    if (benchmark.implementationState === "REPRODUCIBLE") return "M3";
    if (benchmark.implementationState === "EXECUTABLE") return "M2";
    if (
      benchmark.implementationState === "SPECIFIED" ||
      benchmark.implementationState === "SCAFFOLDED"
    )
      return "M1";
    return "M0";
  }

  transitionLifecycle(
    identity: BenchmarkIdentity,
    target: BenchmarkLifecycleState
  ): BenchmarkRegistry {
    const benchmark = this.requireEntry(identity);
    if (!lifecycleTransitions[benchmark.lifecycleState].includes(target)) {
      throw new Error(`Invalid lifecycle transition: ${benchmark.lifecycleState} -> ${target}.`);
    }
    return this.withEntry({ ...benchmark, lifecycleState: target });
  }

  promoteScientificMaturity(
    identity: BenchmarkIdentity,
    target: BenchmarkScientificMaturity,
    evidenceReferences: readonly string[]
  ): BenchmarkRegistry {
    const benchmark = this.requireEntry(identity);
    if (!scientificTransitions[benchmark.scientificMaturity].includes(target)) {
      throw new Error(
        `Invalid scientific maturity transition: ${benchmark.scientificMaturity} -> ${target}.`
      );
    }
    const evidence = {
      ...benchmark.evidence,
      calibration:
        target === "CALIBRATED"
          ? [...benchmark.evidence.calibration, ...evidenceReferences]
          : benchmark.evidence.calibration,
      validation:
        target === "VALIDATED"
          ? [...benchmark.evidence.validation, ...evidenceReferences]
          : benchmark.evidence.validation
    };
    return this.withEntry({ ...benchmark, scientificMaturity: target, evidence });
  }

  serialize(): string {
    return canonicalJson({
      ...this.snapshot,
      families: [...this.snapshot.families].sort((a, b) => a.familyId.localeCompare(b.familyId)),
      constructs: [...this.snapshot.constructs].sort((a, b) =>
        a.constructId.localeCompare(b.constructId)
      ),
      benchmarks: this.list()
    });
  }

  digest(): string {
    return computeSha256(this.serialize());
  }

  private requireEntry(identity: BenchmarkIdentity): CanonicalBenchmarkDefinition {
    const benchmark = this.get(identity);
    if (!benchmark)
      throw new Error(`Unknown benchmark identity '${benchmarkIdentityKey(identity)}'.`);
    return benchmark;
  }

  private withEntry(updated: CanonicalBenchmarkDefinition): BenchmarkRegistry {
    return new BenchmarkRegistry({
      ...this.snapshot,
      benchmarks: this.snapshot.benchmarks.map((benchmark) =>
        benchmarkIdentityKey(benchmark.identity) === benchmarkIdentityKey(updated.identity)
          ? updated
          : benchmark
      )
    });
  }
}
