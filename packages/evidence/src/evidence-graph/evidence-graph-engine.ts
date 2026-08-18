/**
 * @package @semantiq/evidence
 * Cross-Run Evidence Graph & Comparative Query Engine
 * 
 * Invariants:
 * 1. Absence is not counterevidence (unobserved cells remain 'no_observation' at R0).
 * 2. Deterministic R0–R4 strength scale:
 *    - R0: 0.0 (No observations)
 *    - R1: 0.25 (Single observation)
 *    - R2: 0.50 (Multi-case observation in single environment)
 *    - R3: 0.75 (Multi-case & multi-environment/model verification)
 *    - R4: 1.00 (Deterministic cross-model & cross-environment reproducible proof)
 */

import { computeSha256 } from "../../../sandbox-contracts/src/index.js";
import {
  type CaseMatrix,
  type CaseMatrixCell,
  type ComparativeQuery,
  type ComparativeQueryResult,
  type RelationEvidenceStatus,
  type RelationObservation,
  EPISTEMIC_ABSENCE_DISCLAIMER,
  RelationStrengthLevel
} from "./types.js";

export class EvidenceGraphEngine {
  private readonly observations: RelationObservation[] = [];

  public addObservation(obs: Omit<RelationObservation, "id" | "recordedAt"> & { id?: string }): RelationObservation {
    const id = obs.id ?? `rel_obs_${computeSha256(`${obs.relationId}:${obs.runId}:${obs.caseId}:${obs.polarity}:${this.observations.length}`).substring(0, 16)}`;
    const fullObs: RelationObservation = {
      ...obs,
      id,
      recordedAt: new Date().toISOString()
    };

    const frozen = Object.freeze(fullObs);
    this.observations.push(frozen);
    return frozen;
  }

  public getObservationsForRelation(sourceId: string, targetId: string): readonly RelationObservation[] {
    return this.observations.filter((o) => o.sourceId === sourceId && o.targetId === targetId);
  }

  public getAllObservations(): readonly RelationObservation[] {
    return Object.freeze([...this.observations]);
  }

  /**
   * Executes a comparative query across runs, environments, and models.
   */
  public executeComparativeQuery(query: ComparativeQuery): ComparativeQueryResult {
    let matched = this.getObservationsForRelation(query.sourceId, query.targetId);

    if (query.relationType) {
      matched = matched.filter((o) => o.relationType === query.relationType);
    }

    if (query.filters?.modelIds && query.filters.modelIds.length > 0) {
      const allowed = new Set(query.filters.modelIds);
      matched = matched.filter((o) => allowed.has(o.modelId));
    }

    if (query.filters?.environmentIds && query.filters.environmentIds.length > 0) {
      const allowed = new Set(query.filters.environmentIds);
      matched = matched.filter((o) => allowed.has(o.environmentId));
    }

    if (query.filters?.caseIds && query.filters.caseIds.length > 0) {
      const allowed = new Set(query.filters.caseIds);
      matched = matched.filter((o) => allowed.has(o.caseId));
    }

    const supporting = matched.filter((o) => o.polarity === "SUPPORTS");
    const refuting = matched.filter((o) => o.polarity === "REFUTES");

    const supportingCount = supporting.length;
    const refutingCount = refuting.length;

    // 1. Calculate Status
    let status: RelationEvidenceStatus = "no_observation";
    if (supportingCount > 0 && refutingCount === 0) {
      status = "supported";
    } else if (supportingCount > 0 && refutingCount > 0) {
      status = "mixed";
    } else if (supportingCount === 0 && refutingCount > 0) {
      status = "counterevidence_only";
    } else {
      status = "no_observation";
    }

    // 2. Generate Case Matrix
    const relationId = `rel_${query.sourceId}_${query.targetId}`;
    const caseMatrix = this.buildCaseMatrix(relationId, matched);

    // 3. Compute R0-R4 Strength Level & Score
    const { strength, strengthScore } = this.calculateStrength(matched, status);

    return {
      query,
      status,
      strength,
      strengthScore,
      supportingObservationsCount: supportingCount,
      refutingObservationsCount: refutingCount,
      caseMatrix,
      epistemicDisclaimer: EPISTEMIC_ABSENCE_DISCLAIMER,
      evaluatedAt: new Date().toISOString()
    };
  }

  private buildCaseMatrix(relationId: string, observations: readonly RelationObservation[]): CaseMatrix {
    const cases = Array.from(new Set(observations.map((o) => o.caseId))).sort();
    const models = Array.from(new Set(observations.map((o) => o.modelId))).sort();
    const environments = Array.from(new Set(observations.map((o) => o.environmentId))).sort();

    const cells: CaseMatrixCell[] = [];

    for (const c of cases) {
      for (const m of models) {
        for (const env of environments) {
          const cellObs = observations.filter(
            (o) => o.caseId === c && o.modelId === m && o.environmentId === env
          );

          const supp = cellObs.filter((o) => o.polarity === "SUPPORTS").length;
          const ref = cellObs.filter((o) => o.polarity === "REFUTES").length;

          let cellStatus: RelationEvidenceStatus = "no_observation";
          if (supp > 0 && ref === 0) cellStatus = "supported";
          else if (supp > 0 && ref > 0) cellStatus = "mixed";
          else if (supp === 0 && ref > 0) cellStatus = "counterevidence_only";

          cells.push({
            caseId: c,
            modelId: m,
            environmentId: env,
            status: cellStatus,
            supportingCount: supp,
            refutingCount: ref,
            observationIds: cellObs.map((o) => o.id)
          });
        }
      }
    }

    const totalPossibleCells = Math.max(1, cases.length * models.length * environments.length);
    const observedCells = cells.filter((c) => c.status !== "no_observation").length;
    const coverageRatio = Number((observedCells / totalPossibleCells).toFixed(3));

    return {
      relationId,
      cases,
      models,
      environments,
      cells: Object.freeze(cells),
      coverageSummary: {
        totalPossibleCells,
        observedCells,
        coverageRatio,
        uniqueCasesCount: cases.length,
        uniqueModelsCount: models.length,
        uniqueEnvironmentsCount: environments.length
      }
    };
  }

  private calculateStrength(
    observations: readonly RelationObservation[],
    status: RelationEvidenceStatus
  ): { strength: RelationStrengthLevel; strengthScore: number } {
    if (observations.length === 0 || status === "no_observation") {
      return { strength: RelationStrengthLevel.R0, strengthScore: 0.0 };
    }

    const uniqueCases = new Set(observations.map((o) => o.caseId)).size;
    const uniqueModels = new Set(observations.map((o) => o.modelId)).size;
    const uniqueEnvs = new Set(observations.map((o) => o.environmentId)).size;

    // R4: Cross-model (>=3) & Cross-environment (>=3), with clean status (not mixed)
    if (uniqueModels >= 3 && uniqueEnvs >= 3 && uniqueCases >= 3 && (status === "supported" || status === "counterevidence_only")) {
      return { strength: RelationStrengthLevel.R4, strengthScore: 1.0 };
    }

    // R3: Multi-case (>=2) & Multi-environment/model (>=2 models & >=2 envs)
    if (uniqueCases >= 2 && uniqueModels >= 2 && uniqueEnvs >= 2) {
      return { strength: RelationStrengthLevel.R3, strengthScore: 0.75 };
    }

    // R2: Multi-case (>=2 cases) in at least 1 environment
    if (uniqueCases >= 2) {
      return { strength: RelationStrengthLevel.R2, strengthScore: 0.5 };
    }

    // R1: Single observation or single case
    return { strength: RelationStrengthLevel.R1, strengthScore: 0.25 };
  }
}
